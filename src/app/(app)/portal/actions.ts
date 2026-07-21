'use server'

import { revalidatePath } from 'next/cache'

import { usuarioActual } from '@/lib/auth/usuario-actual'
import { insertarMensaje } from '@/lib/chat/enviar-mensaje'
import { createClient } from '@/lib/supabase/server'

export async function enviarMensajePortal(formData: FormData) {
  const actual = await usuarioActual()
  // El cliente solo escribe en su propio chat (la RLS lo garantiza también).
  if (actual.rol !== 'cliente' || !actual.clienteId) return
  const texto = formData.get('texto')
  if (typeof texto !== 'string') return
  await insertarMensaje(actual.clienteId, texto)
  // El chat flotante vive en el layout: revalidar todo el árbol del portal.
  revalidatePath('/portal', 'layout')
}

/** Marca como leídos los mensajes recibidos (los que no escribió el cliente). */
export async function marcarMensajesLeidos() {
  const actual = await usuarioActual()
  const sub = actual.claims?.sub
  if (actual.rol !== 'cliente' || !actual.clienteId || typeof sub !== 'string')
    return
  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('cliente_id', actual.clienteId)
    .eq('leido', false)
    // Solo los del otro lado (autor_id nulo = autor eliminado, también cuenta).
    .or(`autor_id.neq.${sub},autor_id.is.null`)
  if (error) console.error('Error al marcar mensajes leídos:', error)
  revalidatePath('/portal', 'layout')
}

/** Marca todas las notificaciones del cliente como leídas (campanita). */
export async function marcarNotificacionesLeidas() {
  const actual = await usuarioActual()
  if (actual.rol !== 'cliente' || !actual.clienteId) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('cliente_id', actual.clienteId)
    .eq('leida', false)
  if (error) console.error('Error al marcar notificaciones leídas:', error)
  revalidatePath('/portal', 'layout')
}

/** Marca el tour de bienvenida como visto (la RLS solo permite la fila propia). */
export async function marcarIntroVista() {
  const actual = await usuarioActual()
  const sub = actual.claims?.sub
  if (typeof sub !== 'string') return
  const supabase = await createClient()
  const { error } = await supabase
    .from('usuarios')
    .update({ intro_vista: true })
    .eq('user_id', sub)
  if (error) console.error('Error al marcar intro como vista:', error)
}
