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
  conversaciones_7d: number
  sincronizada_en: string
}

/** cliente null = fallo de la corrida completa, no de un cliente. */
export type ErrorSync = { cliente: string | null; mensaje: string }

export type ResultadoSync = {
  exito: boolean
  campaniasActualizadas: number
  errores: ErrorSync[]
}

/**
 * Une cada campania con sus insights de vida completa y de los ultimos 7
 * dias (por id/campaign_id) y produce las filas a upsertear mas el gasto de
 * cada ventana por meta_campaign_id. Campania sin insight en una ventana:
 * 0 conversaciones y gasto 0 en esa ventana.
 */
export function prepararCampanias(
  clienteId: string,
  campanias: CampaniaMeta[],
  insights: InsightCampania[],
  insights7d: InsightCampania[],
  ahora: string
): {
  filas: FilaCampania[]
  gastos: Map<string, number>
  gastos7d: Map<string, number>
} {
  const porCampania = new Map(insights.map((i) => [i.campaign_id, i]))
  const porCampania7d = new Map(insights7d.map((i) => [i.campaign_id, i]))
  const filas: FilaCampania[] = []
  const gastos = new Map<string, number>()
  const gastos7d = new Map<string, number>()

  for (const campania of campanias) {
    const insight = porCampania.get(campania.id)
    const insight7d = porCampania7d.get(campania.id)
    filas.push({
      cliente_id: clienteId,
      meta_campaign_id: campania.id,
      nombre: campania.name,
      plataforma: 'Meta',
      estado: estadoDesdeMeta(campania.effective_status),
      fecha_inicio: campania.start_time?.slice(0, 10) ?? null,
      leads_generados: conversacionesDe(insight?.actions),
      conversaciones_7d: conversacionesDe(insight7d?.actions),
      sincronizada_en: ahora,
    })
    gastos.set(campania.id, gastoDe(insight?.spend))
    gastos7d.set(campania.id, gastoDe(insight7d?.spend))
  }

  return { filas, gastos, gastos7d }
}

/**
 * Ids de filas ya sincronizadas cuyo meta_campaign_id no vino en la
 * respuesta de Meta (fueron borradas/archivadas alla).
 *
 * OJO: con recibidas vacio regresa TODOS los ids — por eso el orquestador
 * salta el archivado cuando el fetch regresa 0 campanias.
 */
export function idsParaArchivar(
  existentes: { id: string; meta_campaign_id: string | null }[],
  recibidas: CampaniaMeta[]
): string[] {
  const vigentes = new Set(recibidas.map((c) => c.id))
  return existentes
    .filter(
      (e) => e.meta_campaign_id !== null && !vigentes.has(e.meta_campaign_id)
    )
    .map((e) => e.id)
}

export type MetricaDiaria = {
  campania_id: string
  cliente_id: string
  fecha: string
  gasto: number
  conversaciones: number
}

/**
 * Filas diarias (ventana de 30 dias, time_increment=1) listas para upsert.
 * Solo campanias presentes en idPorMeta (el mapa meta_campaign_id → id
 * interno del upsert de campanias); filas sin fecha se descartan.
 */
export function prepararMetricasDiarias(
  idPorMeta: Map<string, string>,
  clienteId: string,
  insightsDiarios: InsightCampania[]
): MetricaDiaria[] {
  const filas: MetricaDiaria[] = []
  for (const insight of insightsDiarios) {
    const campaniaId = idPorMeta.get(insight.campaign_id)
    if (!campaniaId || !insight.date_start) continue
    filas.push({
      campania_id: campaniaId,
      cliente_id: clienteId,
      fecha: insight.date_start,
      gasto: gastoDe(insight.spend),
      conversaciones: conversacionesDe(insight.actions),
    })
  }
  return filas
}

type AdminClient = ReturnType<typeof createAdminClient>
type ClienteVinculado = { id: string; meta_ad_account_id: string }

/**
 * Trae campanias + insights de un cliente y upsertea campanias y
 * campania_finanzas. Regresa cuantas filas se actualizaron y lo recibido
 * de Meta (insumo del paso de archivado). Lanza en cualquier fallo.
 */
async function sincronizarCliente(
  supabase: AdminClient,
  cliente: ClienteVinculado
): Promise<{ actualizadas: number; recibidas: CampaniaMeta[] }> {
  // meta_ad_account_id se guarda con prefijo act_; normalizar por si acaso.
  const cuenta = cliente.meta_ad_account_id.startsWith('act_')
    ? cliente.meta_ad_account_id
    : `act_${cliente.meta_ad_account_id}`

  const recibidas = await obtenerTodos<CampaniaMeta>(`/${cuenta}/campaigns`, {
    fields: 'id,name,objective,status,effective_status,start_time,stop_time',
    // IN_PROCESS y WITH_ISSUES son campanias vivas (mapeo.ts las trata
    // como 'pausada'); pedirlas evita archivarlas en falso por no venir
    // en la respuesta.
    effective_status:
      '["ACTIVE","PAUSED","IN_PROCESS","WITH_ISSUES","ARCHIVED"]',
    limit: '100',
  })
  const insights = await obtenerTodos<InsightCampania>(`/${cuenta}/insights`, {
    level: 'campaign',
    fields: 'campaign_id,spend,actions',
    date_preset: 'maximum',
  })
  // Ventana del semaforo: como va la campania AHORA, no en toda su vida.
  const insights7d = await obtenerTodos<InsightCampania>(
    `/${cuenta}/insights`,
    {
      level: 'campaign',
      fields: 'campaign_id,spend,actions',
      date_preset: 'last_7d',
    }
  )
  const { filas, gastos, gastos7d } = prepararCampanias(
    cliente.id,
    recibidas,
    insights,
    insights7d,
    new Date().toISOString()
  )
  if (filas.length === 0) return { actualizadas: 0, recibidas }

  // Upsert idempotente de campanias.
  const { data: upsertadas, error: errorUpsert } = await supabase
    .from('campanias')
    .upsert(filas, { onConflict: 'meta_campaign_id' })
    .select('id, meta_campaign_id')
  if (errorUpsert) throw new Error(errorUpsert.message)

  // Gasto (solo-admin) ligado por el id interno recien devuelto.
  const finanzas = (upsertadas ?? []).map((fila) => ({
    campania_id: fila.id,
    cliente_id: cliente.id,
    gasto: gastos.get(fila.meta_campaign_id) ?? 0,
    gasto_7d: gastos7d.get(fila.meta_campaign_id) ?? 0,
  }))
  const { error: errorFinanzas } = await supabase
    .from('campania_finanzas')
    .upsert(finanzas, { onConflict: 'campania_id' })
  if (errorFinanzas) throw new Error(errorFinanzas.message)

  // Serie diaria del dashboard: se pide y guarda AL FINAL, despues de que
  // campanias y finanzas ya quedaron — si esta llamada falla, el semaforo
  // del cliente no pierde su corrida (idempotente por campania+fecha).
  const insightsDiarios = await obtenerTodos<InsightCampania>(
    `/${cuenta}/insights`,
    {
      level: 'campaign',
      fields: 'campaign_id,spend,actions',
      date_preset: 'last_30d',
      time_increment: '1',
    }
  )
  const idPorMeta = new Map(
    (upsertadas ?? []).map((fila) => [fila.meta_campaign_id, fila.id])
  )
  const diarias = prepararMetricasDiarias(idPorMeta, cliente.id, insightsDiarios)
  if (diarias.length > 0) {
    const { error: errorDiarias } = await supabase
      .from('campania_metricas_diarias')
      .upsert(diarias, { onConflict: 'campania_id,fecha' })
    if (errorDiarias) throw new Error(errorDiarias.message)
  }

  return { actualizadas: filas.length, recibidas }
}

/**
 * Archiva las campanias ya sincronizadas que no vinieron en la respuesta
 * de Meta. Solo corre cuando el fetch del cliente funciono.
 */
async function archivarAusentes(
  supabase: AdminClient,
  clienteId: string,
  recibidas: CampaniaMeta[]
): Promise<void> {
  // Una respuesta vacia — legitima o parcial — nunca debe borrar el
  // historial del cliente. Las campanias borradas en Meta se archivan en
  // corridas donde la cuenta si regresa sus demas campanias.
  if (recibidas.length === 0) return

  const { data: existentes, error: errorExistentes } = await supabase
    .from('campanias')
    .select('id, meta_campaign_id')
    .eq('cliente_id', clienteId)
    .not('meta_campaign_id', 'is', null)
  if (errorExistentes) throw new Error(errorExistentes.message)

  const paraArchivar = idsParaArchivar(existentes ?? [], recibidas)
  if (paraArchivar.length === 0) return

  const { error: errorArchivo } = await supabase
    .from('campanias')
    .update({ estado: 'archivada' })
    .in('id', paraArchivar)
  if (errorArchivo) throw new Error(errorArchivo.message)
}

/** Corre el sync completo. Un cliente que falla nunca detiene a los demas. */
export async function sincronizarMeta(
  disparador: 'cron' | 'manual'
): Promise<ResultadoSync> {
  const errores: ErrorSync[] = []
  let campaniasActualizadas = 0

  try {
    const supabase = createAdminClient()
    const limite = Date.now() + PRESUPUESTO_MS

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
        cliente: null,
        mensaje: `No se pudieron leer los clientes: ${errorClientes.message}`,
      })
    }

    for (const [indice, c] of (clientes ?? []).entries()) {
      // 3. Presupuesto global de tiempo: lo que no alcance queda
      // registrado y se recoge en la siguiente corrida.
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
        const { actualizadas, recibidas } = await sincronizarCliente(
          supabase,
          c
        )
        // Credito antes de archivar: un fallo del archivado no debe
        // anular las campanias ya subidas de este cliente.
        campaniasActualizadas += actualizadas
        await archivarAusentes(supabase, c.id, recibidas)
      } catch (error) {
        errores.push({ cliente: c.id, mensaje: (error as Error).message })
      }
    }

    // 4. Retencion de la serie diaria: una vez por corrida (paso global,
    // no de un cliente). Mantiene la tabla acotada a ~90 dias.
    const corte = new Date(Date.now() - 90 * 86400000)
      .toISOString()
      .slice(0, 10)
    const { error: errorPoda } = await supabase
      .from('campania_metricas_diarias')
      .delete()
      .lt('fecha', corte)
    if (errorPoda) {
      errores.push({
        cliente: null,
        mensaje: `No se pudo podar la serie diaria: ${errorPoda.message}`,
      })
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
  } catch (error) {
    // Los callers (cron, server action) nunca deben ver un rechazo.
    console.error('sincronizarMeta fallo inesperadamente:', error)
    return {
      exito: false,
      campaniasActualizadas,
      errores: [
        ...errores,
        {
          cliente: null,
          mensaje: `Fallo inesperado: ${(error as Error).message}`,
        },
      ],
    }
  }
}
