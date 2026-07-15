'use server'

import { revalidatePath } from 'next/cache'

import { usuarioActual } from '@/lib/auth/usuario-actual'
import { insertarMensaje } from '@/lib/chat/enviar-mensaje'

export async function enviarMensajePortal(formData: FormData) {
  const actual = await usuarioActual()
  // El cliente solo escribe en su propio chat (la RLS lo garantiza también).
  if (actual.rol !== 'cliente' || !actual.clienteId) return
  const texto = formData.get('texto')
  if (typeof texto !== 'string') return
  await insertarMensaje(actual.clienteId, texto)
  revalidatePath('/portal/chat')
}
