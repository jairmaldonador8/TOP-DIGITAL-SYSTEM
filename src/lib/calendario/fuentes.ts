/**
 * Fuentes del calendario de operación: campañas, encargos, tareas y
 * eventos manuales, unificados como ElementoCalendario. Acepta cualquier
 * cliente de Supabase (sesión en la página; admin en el feed ICS).
 *
 * OJO: encargos.asignado_a referencia auth.users (no expuesto a
 * PostgREST), así que el nombre del integrante se resuelve con una quinta
 * consulta a usuarios y join en memoria (patrón de agencia/equipo).
 */
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { ElementoCalendario } from './tipos'

type FilaCampania = {
  id: string
  nombre: string
  fecha_inicio: string
  clientes: { nombre_negocio: string } | null
}
type FilaEncargo = {
  id: string
  titulo: string
  fecha_limite: string
  asignado_a: string
}
type FilaTarea = {
  id: string
  titulo: string
  fecha_limite: string
  clientes: { nombre_negocio: string } | null
}
type FilaEvento = {
  id: string
  titulo: string
  descripcion: string | null
  fecha: string
  hora: string | null
  tipo: string
  clientes: { nombre_negocio: string } | null
}

export type FuentesCrudas = {
  campanias: FilaCampania[]
  encargos: FilaEncargo[]
  tareas: FilaTarea[]
  eventos: FilaEvento[]
  nombresIntegrantes: Map<string, string>
}

/** Mapeo puro fuentes → elementos, ordenados por fecha (y hora). */
export function construirElementos(fuentes: FuentesCrudas): ElementoCalendario[] {
  const elementos: ElementoCalendario[] = []

  for (const campania of fuentes.campanias) {
    elementos.push({
      id: campania.id,
      uid: `campania:${campania.id}`,
      fecha: campania.fecha_inicio,
      hora: null,
      titulo: `Arranca: ${campania.nombre}`,
      detalle: campania.clientes?.nombre_negocio ?? null,
      tipo: 'campania',
      subtipo: null,
      href: '/agencia/campanias',
    })
  }

  for (const encargo of fuentes.encargos) {
    const integrante = fuentes.nombresIntegrantes.get(encargo.asignado_a)
    elementos.push({
      id: encargo.id,
      uid: `encargo:${encargo.id}`,
      fecha: encargo.fecha_limite,
      hora: null,
      titulo: `Entrega: ${encargo.titulo}`,
      detalle: integrante ?? null,
      tipo: 'encargo',
      subtipo: null,
      href: '/agencia/equipo',
    })
  }

  for (const tarea of fuentes.tareas) {
    elementos.push({
      id: tarea.id,
      uid: `tarea:${tarea.id}`,
      fecha: tarea.fecha_limite,
      hora: null,
      titulo: tarea.titulo,
      detalle: tarea.clientes?.nombre_negocio ?? null,
      tipo: 'tarea',
      subtipo: null,
      href: '/agencia/tareas',
    })
  }

  for (const evento of fuentes.eventos) {
    elementos.push({
      id: evento.id,
      uid: `evento:${evento.id}`,
      fecha: evento.fecha,
      // time de Postgres llega como HH:MM:SS — la UI e ICS usan HH:MM.
      hora: evento.hora ? evento.hora.slice(0, 5) : null,
      titulo: evento.titulo,
      detalle:
        [evento.clientes?.nombre_negocio, evento.descripcion]
          .filter(Boolean)
          .join(' · ') || null,
      tipo: 'evento',
      subtipo: evento.tipo,
      href: '/agencia/calendario',
    })
  }

  return elementos.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      (a.hora ?? '99').localeCompare(b.hora ?? '99') ||
      a.titulo.localeCompare(b.titulo, 'es')
  )
}

/** Las 5 consultas del rango [desde, hasta] + mapeo. */
export async function cargarElementos(
  // Cliente de sesión (página) o admin (feed): mismas consultas.
  supabase: SupabaseClient,
  desde: string,
  hasta: string
): Promise<ElementoCalendario[]> {
  const [campanias, encargos, tareas, eventos, integrantes] =
    await Promise.all([
      supabase
        .from('campanias')
        .select('id, nombre, fecha_inicio, clientes ( nombre_negocio )')
        .gte('fecha_inicio', desde)
        .lte('fecha_inicio', hasta),
      supabase
        .from('encargos')
        .select('id, titulo, fecha_limite, asignado_a')
        .neq('estado', 'aprobado')
        .gte('fecha_limite', desde)
        .lte('fecha_limite', hasta),
      supabase
        .from('tareas')
        .select('id, titulo, fecha_limite, clientes ( nombre_negocio )')
        .neq('estado', 'completada')
        .gte('fecha_limite', desde)
        .lte('fecha_limite', hasta),
      supabase
        .from('eventos')
        .select(
          'id, titulo, descripcion, fecha, hora, tipo, clientes ( nombre_negocio )'
        )
        .gte('fecha', desde)
        .lte('fecha', hasta),
      supabase.from('usuarios').select('user_id, nombre').eq('rol', 'equipo'),
    ])

  for (const r of [campanias, encargos, tareas, eventos, integrantes]) {
    if (r.error) console.error('Error al cargar calendario:', r.error)
  }

  return construirElementos({
    campanias: (campanias.data ?? []) as unknown as FilaCampania[],
    encargos: (encargos.data ?? []) as FilaEncargo[],
    tareas: (tareas.data ?? []) as unknown as FilaTarea[],
    eventos: (eventos.data ?? []) as unknown as FilaEvento[],
    nombresIntegrantes: new Map(
      ((integrantes.data ?? []) as { user_id: string; nombre: string | null }[]).map(
        (u) => [u.user_id, u.nombre ?? 'Integrante']
      )
    ),
  })
}
