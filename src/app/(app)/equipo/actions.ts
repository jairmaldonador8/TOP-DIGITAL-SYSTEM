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
  revalidatePath('/agencia', 'layout')
  return { ok: true }
}

/** El trabajador escribe en su hilo con el dueño. */
export async function enviarMensajeEquipo(formData: FormData) {
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  if (actual.rol !== 'equipo' || !miId) return
  const texto = formData.get('texto')
  if (typeof texto !== 'string') return
  const limpio = texto.trim().slice(0, 2000)
  if (!limpio) return

  const supabase = await createClient()
  const { error } = await supabase.from('mensajes_equipo').insert({
    trabajador_id: miId,
    autor_id: miId,
    autor_nombre: actual.nombre ?? 'Integrante',
    texto: limpio,
  })
  if (error) console.error('Error al enviar mensaje de equipo:', error)
  revalidatePath('/equipo', 'layout')
}

/** Marca leídos los mensajes del dueño en el hilo propio. */
export async function marcarMensajesEquipoLeidos() {
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  if (actual.rol !== 'equipo' || !miId) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajes_equipo')
    .update({ leido: true })
    .eq('trabajador_id', miId)
    .eq('leido', false)
    .or(`autor_id.neq.${miId},autor_id.is.null`)
  if (error) console.error('Error al marcar leídos (equipo):', error)
  revalidatePath('/equipo', 'layout')
}
