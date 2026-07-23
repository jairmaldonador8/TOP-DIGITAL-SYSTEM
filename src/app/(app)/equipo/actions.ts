'use server'

import { revalidatePath } from 'next/cache'

import { esUuid } from '@/lib/acciones'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import {
  puedeTransicionar,
  type EstadoEncargo,
} from '@/lib/equipo/transiciones'
import { createClient } from '@/lib/supabase/server'

export type ResultadoAvance = { ok: true } | { ok: false; mensaje: string }

/**
 * El trabajador avanza SU encargo: empezar (pendiente/cambios → en_progreso)
 * o entregar (en_progreso → entregado). La máquina de estados también está
 * respaldada en la base (RLS + trigger de la migración 0015).
 */
export async function avanzarEncargo(
  encargoId: string,
  a: 'en_progreso' | 'entregado'
): Promise<ResultadoAvance> {
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  if (actual.rol !== 'equipo' || !miId) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!esUuid(encargoId) || (a !== 'en_progreso' && a !== 'entregado')) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }

  const supabase = await createClient()
  const { data: encargo } = await supabase
    .from('encargos')
    .select('id, estado, asignado_a')
    .eq('id', encargoId)
    .maybeSingle()

  if (!encargo || encargo.asignado_a !== miId) {
    return { ok: false, mensaje: 'El encargo no existe' }
  }
  if (!puedeTransicionar('equipo', encargo.estado as EstadoEncargo, a)) {
    return { ok: false, mensaje: 'Ese paso no está disponible ahora' }
  }

  const { error } = await supabase
    .from('encargos')
    .update(
      a === 'entregado'
        ? { estado: 'entregado', entregado_en: new Date().toISOString() }
        : { estado: 'en_progreso' }
    )
    .eq('id', encargoId)

  if (error) {
    console.error('Error al avanzar encargo:', error)
    return { ok: false, mensaje: 'No se pudo guardar, intenta de nuevo' }
  }

  revalidatePath('/equipo', 'layout')
  revalidatePath('/agencia/equipo')
  return { ok: true }
}
