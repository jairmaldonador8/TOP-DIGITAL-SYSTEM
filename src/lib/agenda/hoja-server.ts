// src/lib/agenda/hoja-server.ts
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { DatosHojaAgregar } from '@/components/agenda/hoja-agregar'

/**
 * Datos de la hoja "+": clientes activos (cita, pendiente, encargo) e
 * integrantes del equipo (encargo). Mismas consultas que Equipo.
 */
export async function cargarDatosHojaAgregar(
  supabase: SupabaseClient,
  hoy: string
): Promise<DatosHojaAgregar> {
  const [clientes, integrantes] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .eq('es_agencia', false)
      .order('nombre_negocio'),
    supabase
      .from('usuarios')
      .select('user_id, nombre, puesto')
      .eq('rol', 'equipo')
      .order('nombre'),
  ])
  for (const r of [clientes, integrantes]) if (r.error) console.error('Error al cargar la hoja +:', r.error)

  return {
    hoy,
    clientes: (clientes.data ?? []) as { id: string; nombre_negocio: string }[],
    trabajadores: ((integrantes.data ?? []) as { user_id: string; nombre: string | null; puesto: string | null }[]).map(
      (i) => ({ userId: i.user_id, nombre: i.nombre ?? 'Integrante', puesto: i.puesto ?? '—' })
    ),
  }
}
