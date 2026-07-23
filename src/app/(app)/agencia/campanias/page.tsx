import type { Metadata } from 'next'

import { BotonSincronizar } from '@/components/campanias/boton-sincronizar'
import {
  CampaniaFormDialog,
  type ClienteOpcion,
} from '@/components/campanias/campania-form'
import {
  CuadriculaClientes,
  type CampaniaSemaforo,
  type ClienteSemaforo,
} from '@/components/campanias/cuadricula-clientes'
import { Card } from '@/components/ui/card'
import {
  deltasSemana,
  gastoDelMes,
  proyeccionMes,
  serieDiaria,
  type FilaDiaria,
} from '@/lib/campanias/metricas'
import { promedioCPL, saludCampania } from '@/lib/campanias/salud'
import type { EstadoCampania } from '@/lib/campanias/tipos'
import { hoyEnMexico } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Campañas',
}

type FilaCampaniaDb = {
  id: string
  nombre: string
  estado: EstadoCampania
  leads_generados: number
  conversaciones_7d: number
  meta_campaign_id: string | null
  cliente_id: string
}

type FilaClienteDb = {
  id: string
  nombre_negocio: string
  meta_ad_account_id: string | null
  es_agencia: boolean
  presupuesto_ads: number
}

type FilaDiariaDb = {
  cliente_id: string
  fecha: string
  gasto: number
  conversaciones: number
}

const ORDEN_SALUD = { rojo: 0, ambar: 1, verde: 2, gris: 3 } as const

export default async function PaginaCampaniasAgencia() {
  const supabase = await createClient()

  const hoy = hoyEnMexico()
  // La serie diaria debe cubrir el mes calendario completo (para el track
  // de presupuesto, incluso el día 31) Y al menos 30 días (para la gráfica).
  const hace29 = new Date(`${hoy}T12:00:00Z`)
  hace29.setUTCDate(hace29.getUTCDate() - 29)
  const inicioMes = `${hoy.slice(0, 7)}-01`
  const desde =
    inicioMes < hace29.toISOString().slice(0, 10)
      ? inicioMes
      : hace29.toISOString().slice(0, 10)

  // Finanzas es tabla sensible (solo admin): consulta aparte del listado.
  const [campanias, finanzas, diarias, clientesRes, syncRes] =
    await Promise.all([
    supabase
      .from('campanias')
      .select(
        'id, nombre, estado, leads_generados, conversaciones_7d, meta_campaign_id, cliente_id'
      ),
    supabase.from('campania_finanzas').select('campania_id, gasto, gasto_7d'),
    supabase
      .from('campania_metricas_diarias')
      .select('cliente_id, fecha, gasto, conversaciones')
      .gte('fecha', desde),
    supabase
      .from('clientes')
      .select(
        'id, nombre_negocio, meta_ad_account_id, es_agencia, presupuesto_ads'
      )
      .eq('estado', 'activo')
      .order('nombre_negocio'),
    // Última corrida del sync de Meta (bitácora solo-admin).
    supabase
      .from('sync_runs')
      .select('fin, exito')
      .order('inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Sin finanzas el semáforo mentiría (todo gris): también es error fatal.
  const errorCarga =
    campanias.error ?? finanzas.error ?? diarias.error ?? clientesRes.error
  if (errorCarga) {
    console.error('Error al cargar campañas:', errorCarga)
  }

  // Serie diaria agregada por cliente+día (suma entre sus campañas).
  const diariasPorCliente = new Map<string, Map<string, FilaDiaria>>()
  for (const fila of (diarias.data ?? []) as FilaDiariaDb[]) {
    const porDia =
      diariasPorCliente.get(fila.cliente_id) ?? new Map<string, FilaDiaria>()
    const dia = porDia.get(fila.fecha) ?? {
      fecha: fila.fecha,
      gasto: 0,
      conversaciones: 0,
    }
    dia.gasto += Number(fila.gasto)
    dia.conversaciones += fila.conversaciones
    porDia.set(fila.fecha, dia)
    diariasPorCliente.set(fila.cliente_id, porDia)
  }

  const filasCampanias = (campanias.data ?? []) as FilaCampaniaDb[]
  const filasClientes = (clientesRes.data ?? []) as FilaClienteDb[]
  const finanzasPor = new Map(
    (
      (finanzas.data ?? []) as {
        campania_id: string
        gasto: number
        gasto_7d: number
      }[]
    ).map((fila) => [fila.campania_id, fila])
  )

  // Semáforo por cliente: promedio histórico propio + reglas de salud.
  const porCliente = new Map<string, FilaCampaniaDb[]>()
  for (const campania of filasCampanias) {
    const lista = porCliente.get(campania.cliente_id) ?? []
    lista.push(campania)
    porCliente.set(campania.cliente_id, lista)
  }

  const tarjetas: ClienteSemaforo[] = filasClientes
    .filter((c) => !c.es_agencia)
    .map((cliente) => {
      const propias = porCliente.get(cliente.id) ?? []
      const promedio = promedioCPL(
        propias.map((campania) => ({
          gasto: Number(finanzasPor.get(campania.id)?.gasto ?? 0),
          conversaciones: campania.leads_generados,
        }))
      )

      const evaluadas: CampaniaSemaforo[] = propias.map((campania) => {
        const gasto7d = Number(finanzasPor.get(campania.id)?.gasto_7d ?? 0)
        const salud = saludCampania({
          estado: campania.estado,
          gasto7d,
          conversaciones7d: campania.conversaciones_7d,
          promedioCliente: promedio,
        })
        return {
          id: campania.id,
          nombre: campania.nombre,
          estado: campania.estado,
          salud,
          esMeta: campania.meta_campaign_id != null,
          conversaciones7d: campania.conversaciones_7d,
          gasto7d,
          cpl7d:
            campania.conversaciones_7d > 0
              ? gasto7d / campania.conversaciones_7d
              : null,
          cuentaMeta: cliente.meta_ad_account_id,
        }
      })

      const ordenadas = [...evaluadas].sort(
        (a, b) =>
          ORDEN_SALUD[a.salud] - ORDEN_SALUD[b.salud] ||
          b.gasto7d - a.gasto7d ||
          a.nombre.localeCompare(b.nombre, 'es')
      )
      const esReciente = (campania: CampaniaSemaforo) =>
        campania.estado === 'activa' ||
        campania.gasto7d > 0 ||
        campania.conversaciones7d > 0

      const filasDiarias = [
        ...(diariasPorCliente.get(cliente.id)?.values() ?? []),
      ]
      const gastoMes = gastoDelMes(filasDiarias, hoy)

      return {
        id: cliente.id,
        nombre: cliente.nombre_negocio,
        activas: evaluadas.filter((c) => c.estado === 'activa').length,
        verdes: evaluadas.filter((c) => c.salud === 'verde').length,
        ambars: evaluadas.filter((c) => c.salud === 'ambar').length,
        rojas: evaluadas.filter((c) => c.salud === 'rojo').length,
        recientes: ordenadas.filter(esReciente),
        historicas: ordenadas.filter((c) => !esReciente(c)),
        dashboard: {
          serie: serieDiaria(filasDiarias, 30, hoy),
          kpis: deltasSemana(filasDiarias, hoy),
          gastoMes,
          proyeccion: proyeccionMes(gastoMes, hoy),
          presupuesto: Number(cliente.presupuesto_ads ?? 0),
        },
      }
    })
    .sort(
      (a, b) =>
        b.rojas - a.rojas ||
        b.activas - a.activas ||
        a.nombre.localeCompare(b.nombre, 'es')
    )

  const clientes = filasClientes.map(
    ({ id, nombre_negocio }) => ({ id, nombre_negocio }) as ClienteOpcion
  )
  const ultimaSync = (syncRes.data ?? null) as {
    fin: string | null
    exito: boolean
  } | null

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campañas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El pulso de cada cliente: verde va bien, rojo necesita atención.
          </p>
        </div>
        <CampaniaFormDialog clientes={clientes} />
      </header>

      <BotonSincronizar ultimaSync={ultimaSync} />

      {errorCarga ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar las campañas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : (
        <CuadriculaClientes clientes={tarjetas} />
      )}
    </div>
  )
}
