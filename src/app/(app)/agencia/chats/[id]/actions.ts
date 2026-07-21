'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin } from '@/lib/acciones'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { insertarMensaje } from '@/lib/chat/enviar-mensaje'
import { createClient } from '@/lib/supabase/server'

export async function enviarMensajeAgencia(
  clienteId: string,
  formData: FormData
) {
  if (!(await esAdmin())) return
  const texto = formData.get('texto')
  if (typeof texto !== 'string') return
  await insertarMensaje(clienteId, texto)
  revalidatePath(`/agencia/chats/${clienteId}`)
}

/** Marca como leídos los mensajes del cliente al abrir su hilo. */
export async function marcarMensajesLeidosAgencia(clienteId: string) {
  const actual = await usuarioActual()
  const sub = actual.claims?.sub
  if (actual.rol !== 'admin' || typeof sub !== 'string') return
  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('cliente_id', clienteId)
    .eq('leido', false)
    // Solo los del otro lado (autor_id nulo = autor eliminado, también cuenta).
    .or(`autor_id.neq.${sub},autor_id.is.null`)
  if (error) console.error('Error al marcar mensajes leídos (agencia):', error)
  // El aviso flotante vive en el layout de la agencia: revalidar el árbol.
  revalidatePath('/agencia', 'layout')
}
