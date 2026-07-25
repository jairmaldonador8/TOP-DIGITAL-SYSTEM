/**
 * Generación del reporte semanal (spec 2026-07-25). Corre en el cron sin
 * sesión de usuario: usa el cliente admin. El upsert por semana_inicio
 * hace idempotente re-ejecutar el cron.
 */
import 'server-only'

import { hoyEnMexico } from '@/lib/formato'
import {
  rangoSemanaPasada,
  type DatosReporte,
  type RangoSemana,
} from '@/lib/reportes/semanal'
import { createAdminClient } from '@/lib/supabase/admin'

type Acumulado = { leads: number; cierres: number; monto: number }

export async function generarReporteSemanal(
  ahora: Date
): Promise<{ rango: RangoSemana; datos: DatosReporte }> {
  const rango = rangoSemanaPasada(ahora)
  const admin = createAdminClient()

  const [nuevosRes, cierresRes, seguimientosRes, entregadosRes, aprobadosRes, atrasadosRes] =
    await Promise.all([
      admin
        .from('leads')
        .select('cliente_id, clientes ( nombre_negocio )')
        .gte('created_at', rango.desdeUtc)
        .lt('created_at', rango.hastaUtc),
      admin
        .from('leads')
        .select('cliente_id, monto_venta, clientes ( nombre_negocio )')
        .eq('etapa', 'ganado')
        .gte('fecha_cierre', rango.desdeUtc)
        .lt('fecha_cierre', rango.hastaUtc),
      admin
        .from('seguimientos')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', rango.desdeUtc)
        .lt('created_at', rango.hastaUtc),
      admin
        .from('encargos')
        .select('id', { count: 'exact', head: true })
        .gte('entregado_en', rango.desdeUtc)
        .lt('entregado_en', rango.hastaUtc),
      admin
        .from('encargos')
        .select('id', { count: 'exact', head: true })
        .gte('aprobado_en', rango.desdeUtc)
        .lt('aprobado_en', rango.hastaUtc),
      admin
        .from('encargos')
        .select('id', { count: 'exact', head: true })
        .lt('fecha_limite', hoyEnMexico())
        .in('estado', ['pendiente', 'en_progreso', 'cambios']),
    ])

  type FilaLead = {
    cliente_id: string | null
    monto_venta?: number | null
    clientes: { nombre_negocio: string } | null
  }

  const porCliente = new Map<string, Acumulado & { nombre: string }>()
  const acumular = (fila: FilaLead): Acumulado & { nombre: string } => {
    const clave = fila.cliente_id ?? 'sin-cliente'
    const actual = porCliente.get(clave) ?? {
      nombre: fila.clientes?.nombre_negocio ?? 'Sin cliente',
      leads: 0,
      cierres: 0,
      monto: 0,
    }
    porCliente.set(clave, actual)
    return actual
  }

  const nuevos = (nuevosRes.data ?? []) as unknown as FilaLead[]
  for (const fila of nuevos) acumular(fila).leads += 1

  const cierres = (cierresRes.data ?? []) as unknown as FilaLead[]
  let montoCerrado = 0
  for (const fila of cierres) {
    const acumulado = acumular(fila)
    acumulado.cierres += 1
    acumulado.monto += fila.monto_venta ?? 0
    montoCerrado += fila.monto_venta ?? 0
  }

  const datos: DatosReporte = {
    leadsNuevos: nuevos.length,
    cierres: cierres.length,
    montoCerrado,
    seguimientos: seguimientosRes.count ?? 0,
    encargosEntregados: entregadosRes.count ?? 0,
    encargosAprobados: aprobadosRes.count ?? 0,
    encargosAtrasados: atrasadosRes.count ?? 0,
    porCliente: [...porCliente.values()].sort(
      (a, b) => b.monto - a.monto || b.leads - a.leads
    ),
  }

  const { error } = await admin
    .from('reportes_semanales')
    .upsert(
      { semana_inicio: rango.inicio, datos },
      { onConflict: 'semana_inicio' }
    )
  if (error) {
    console.error('Error al guardar reporte semanal:', error)
    throw new Error('No se pudo guardar el reporte semanal')
  }

  return { rango, datos }
}
