'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin } from '@/lib/acciones'
import { insertarMensaje } from '@/lib/chat/enviar-mensaje'

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
