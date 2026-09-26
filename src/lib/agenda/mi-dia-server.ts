// src/lib/agenda/mi-dia-server.ts
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { construirMiDia } from './mi-dia'
import type { CitaDia, MiDia, PendienteDia } from './tipos'

type Rel = { nombre_negocio: string } | { nombre_negocio: string }[] | null
const negocio = (r: Rel) => (Array.isArray(r) ? r[0]?.nombre_negocio : r?.nombre_negocio) ?? null
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null)

/** Las 4 consultas de Mi día (sesión admin) + armado puro. */
export async function cargarMiDia(supabase: SupabaseClient, hoy: string): Promise<MiDia> {
  const [citas, tareas, encargos, integrantes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, titulo, descripcion, fecha, hora, hora_fin, lugar, aviso_min, origen, tipo, cliente_id, clientes ( nombre_negocio )')
      .eq('fecha', hoy)
      .is('borrado_en', null),
    supabase
      .from('tareas')
      .select('id, titulo, estado, fecha_limite, hora, clientes ( nombre_negocio )')
      .neq('estado', 'completada')
      .or(`fecha_limite.is.null,fecha_limite.lte.${hoy}`),
    supabase
      .from('encargos')
      .select('id, titulo, fecha_limite, asignado_a')
      .neq('estado', 'aprobado')
      .lte('fecha_limite', hoy),
    supabase.from('usuarios').select('user_id, nombre').eq('rol', 'equipo'),
  ])
  for (const r of [citas, tareas, encargos, integrantes]) if (r.error) console.error('Error al cargar Mi día:', r.error)

  const nombres = new Map(((integrantes.data ?? []) as { user_id: string; nombre: string | null }[]).map((u) => [u.user_id, u.nombre ?? 'Integrante']))

  return construirMiDia({
    hoy,
    citas: ((citas.data ?? []) as unknown as Array<Record<string, unknown> & { clientes: Rel }>).map((c) => ({
      id: c.id as string,
      titulo: c.titulo as string,
      fecha: c.fecha as string,
      hora: hhmm(c.hora as string | null),
      horaFin: hhmm(c.hora_fin as string | null),
      lugar: (c.lugar as string | null) ?? null,
      cliente: negocio(c.clientes),
      origen: c.origen as CitaDia['origen'],
      avisoMin: (c.aviso_min as number | null) ?? null,
      descripcion: (c.descripcion as string | null) ?? null,
      clienteId: (c.cliente_id as string | null) ?? null,
      tipo: c.tipo as string,
    })),
    pendientes: ((tareas.data ?? []) as unknown as { id: string; titulo: string; estado: PendienteDia['estado']; fecha_limite: string | null; hora: string | null; clientes: Rel }[]).map((t) => ({
      id: t.id, titulo: t.titulo, estado: t.estado, fecha: t.fecha_limite, hora: hhmm(t.hora), cliente: negocio(t.clientes),
    })),
    entregas: ((encargos.data ?? []) as { id: string; titulo: string; fecha_limite: string; asignado_a: string }[]).map((e) => ({
      id: e.id, titulo: e.titulo, fecha: e.fecha_limite, integrante: nombres.get(e.asignado_a) ?? 'Integrante',
    })),
  })
}
