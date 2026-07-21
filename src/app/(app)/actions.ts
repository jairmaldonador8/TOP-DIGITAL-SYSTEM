'use server'

import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

/**
 * Marca el tour de bienvenida como visto. Compartida por ambas zonas
 * (agencia y portal); la RLS solo permite actualizar la fila propia.
 */
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
