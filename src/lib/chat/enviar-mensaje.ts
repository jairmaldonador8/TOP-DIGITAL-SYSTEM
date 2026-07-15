import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

/**
 * Inserta un mensaje del usuario actual en el chat de un cliente. La RLS
 * garantiza el tenant: el rol cliente solo puede insertar en su propio
 * cliente_id, el admin en cualquiera. Errores se registran y se ignoran
 * (el hilo simplemente no muestra el mensaje fallido).
 */
export async function insertarMensaje(clienteId: string, texto: string) {
  const limpio = texto.trim()
  if (!limpio || limpio.length > 2000) return

  const actual = await usuarioActual()
  const sub = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  if (!sub) return

  const supabase = await createClient()
  const { error } = await supabase.from('mensajes').insert({
    cliente_id: clienteId,
    autor_id: sub,
    autor_nombre: actual.nombre,
    texto: limpio,
  })
  if (error) console.error('Error al enviar mensaje:', error)
}
