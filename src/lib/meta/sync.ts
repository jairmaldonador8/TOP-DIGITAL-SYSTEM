/**
 * Orquestador del sync de campanias Meta: recorre los clientes vinculados,
 * trae campanias + insights de la Graph API y hace upserts idempotentes
 * (campanias, campania_finanzas) dejando bitacora en sync_runs.
 *
 * Usa el cliente admin (service role): campania_finanzas y sync_runs son
 * solo-admin bajo RLS y el cron corre sin sesion de usuario.
 */
import 'server-only'

import type { EstadoCampania } from '@/lib/campanias/tipos'
import { createAdminClient } from '@/lib/supabase/admin'

import { obtenerTodos } from './client'
import { conversacionesDe, estadoDesdeMeta, gastoDe } from './mapeo'
import type { CampaniaMeta, InsightCampania } from './tipos'

// La corrida completa debe caber en los 300s de maxDuration del cron; el
// cliente HTTP ya limita la espera por llamada, este presupuesto global
// evita que muchas cuentas lentas acumulen mas de lo que Vercel tolera.
const PRESUPUESTO_MS = 240_000

export type FilaCampania = {
  cliente_id: string
  meta_campaign_id: string
  nombre: string
  plataforma: 'Meta'
  estado: EstadoCampania
  fecha_inicio: string | null
  leads_generados: number
  sincronizada_en: string
}

export type ErrorSync = { cliente: string; mensaje: string }

export type ResultadoSync = {
  exito: boolean
  campaniasActualizadas: number
  errores: ErrorSync[]
}

/**
 * Une cada campania con su insight (por id/campaign_id) y produce las filas
 * a upsertear mas el gasto por meta_campaign_id. Campania sin insight:
 * 0 leads y gasto 0.
 */
export function prepararCampanias(
  clienteId: string,
  campanias: CampaniaMeta[],
  insights: InsightCampania[],
  ahora: string
): { filas: FilaCampania[]; gastos: Map<string, number> } {
  const porCampania = new Map(insights.map((i) => [i.campaign_id, i]))
  const filas: FilaCampania[] = []
  const gastos = new Map<string, number>()

  for (const campania of campanias) {
    const insight = porCampania.get(campania.id)
    filas.push({
      cliente_id: clienteId,
      meta_campaign_id: campania.id,
      nombre: campania.name,
      plataforma: 'Meta',
      estado: estadoDesdeMeta(campania.effective_status),
      fecha_inicio: campania.start_time?.slice(0, 10) ?? null,
      leads_generados: conversacionesDe(insight?.actions),
      sincronizada_en: ahora,
    })
    gastos.set(campania.id, gastoDe(insight?.spend))
  }

  return { filas, gastos }
}

/**
 * Ids de filas ya sincronizadas cuyo meta_campaign_id no vino en la
 * respuesta de Meta (fueron borradas/archivadas alla).
 */
export function idsParaArchivar(
  existentes: { id: string; meta_campaign_id: string | null }[],
  recibidas: CampaniaMeta[]
): string[] {
  const vigentes = new Set(recibidas.map((c) => c.id))
  return existentes
    .filter((e) => e.meta_campaign_id !== null && !vigentes.has(e.meta_campaign_id))
    .map((e) => e.id)
}

/** Corre el sync completo. Un cliente que falla nunca detiene a los demas. */
export async function sincronizarMeta(
  disparador: 'cron' | 'manual'
): Promise<ResultadoSync> {
  const supabase = createAdminClient()
  const limite = Date.now() + PRESUPUESTO_MS
  const errores: ErrorSync[] = []
  let campaniasActualizadas = 0

  // 1. Bitacora: abrir la corrida.
  const { data: corrida, error: errorCorrida } = await supabase
    .from('sync_runs')
    .insert({ disparador })
    .select('id')
    .single()
  if (errorCorrida) {
    console.error('No se pudo abrir sync_runs:', errorCorrida.message)
  }

  // 2. Clientes con cuenta de Meta vinculada.
  const { data: clientes, error: errorClientes } = await supabase
    .from('clientes')
    .select('id, meta_ad_account_id')
    .not('meta_ad_account_id', 'is', null)
  if (errorClientes) {
    errores.push({
      cliente: 'todos',
      mensaje: `No se pudieron leer los clientes: ${errorClientes.message}`,
    })
  }

  for (const [indice, c] of (clientes ?? []).entries()) {
    // 3. Presupuesto global de tiempo: lo que no alcance queda registrado
    // y se recoge en la siguiente corrida.
    if (Date.now() > limite) {
      for (const pendiente of (clientes ?? []).slice(indice)) {
        errores.push({
          cliente: pendiente.id,
          mensaje:
            'Presupuesto de tiempo agotado; cliente pendiente para la proxima corrida',
        })
      }
      break
    }

    try {
      // meta_ad_account_id se guarda con prefijo act_; normalizar por si acaso.
      const cuenta = c.meta_ad_account_id.startsWith('act_')
        ? c.meta_ad_account_id
        : `act_${c.meta_ad_account_id}`

      const campanias = await obtenerTodos<CampaniaMeta>(
        `/${cuenta}/campaigns`,
        {
          fields:
            'id,name,objective,status,effective_status,start_time,stop_time',
          effective_status: '["ACTIVE","PAUSED","ARCHIVED"]',
          limit: '100',
        }
      )
      const insights = await obtenerTodos<InsightCampania>(
        `/${cuenta}/insights`,
        {
          level: 'campaign',
          fields: 'campaign_id,spend,actions',
          date_preset: 'maximum',
        }
      )

      const { filas, gastos } = prepararCampanias(
        c.id,
        campanias,
        insights,
        new Date().toISOString()
      )

      if (filas.length > 0) {
        // 4a. Upsert idempotente de campanias.
        const { data: upsertadas, error: errorUpsert } = await supabase
          .from('campanias')
          .upsert(filas, { onConflict: 'meta_campaign_id' })
          .select('id, meta_campaign_id')
        if (errorUpsert) throw new Error(errorUpsert.message)

        // 4b. Gasto (solo-admin) ligado por el id interno recien devuelto.
        const finanzas = (upsertadas ?? []).map((fila) => ({
          campania_id: fila.id,
          cliente_id: c.id,
          gasto: gastos.get(fila.meta_campaign_id) ?? 0,
        }))
        const { error: errorFinanzas } = await supabase
          .from('campania_finanzas')
          .upsert(finanzas, { onConflict: 'campania_id' })
        if (errorFinanzas) throw new Error(errorFinanzas.message)
      }

      // 4c. Archivar las que ya no vinieron de Meta (solo si el fetch
      // de este cliente funciono: estamos dentro del try).
      const { data: existentes, error: errorExistentes } = await supabase
        .from('campanias')
        .select('id, meta_campaign_id')
        .eq('cliente_id', c.id)
        .not('meta_campaign_id', 'is', null)
      if (errorExistentes) throw new Error(errorExistentes.message)

      const paraArchivar = idsParaArchivar(existentes ?? [], campanias)
      if (paraArchivar.length > 0) {
        const { error: errorArchivo } = await supabase
          .from('campanias')
          .update({ estado: 'archivada' })
          .in('id', paraArchivar)
        if (errorArchivo) throw new Error(errorArchivo.message)
      }

      campaniasActualizadas += filas.length
    } catch (error) {
      errores.push({ cliente: c.id, mensaje: (error as Error).message })
    }
  }

  // 5. Cerrar la bitacora.
  if (corrida) {
    const { error: errorCierre } = await supabase
      .from('sync_runs')
      .update({
        fin: new Date().toISOString(),
        campanias_actualizadas: campaniasActualizadas,
        errores,
        exito: errores.length === 0,
      })
      .eq('id', corrida.id)
    if (errorCierre) {
      console.error('No se pudo cerrar sync_runs:', errorCierre.message)
    }
  }

  return { exito: errores.length === 0, campaniasActualizadas, errores }
}
