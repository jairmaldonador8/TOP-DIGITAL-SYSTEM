'use server'

import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

/**
 * Guarda (o renueva) la suscripción Web Push del usuario actual. La RLS
 * de push_suscripciones limita cada fila a su dueño; el upsert por
 * endpoint renueva llaves cuando el navegador rota la suscripción.
 */
export async function guardarSuscripcionPush(suscripcion: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<boolean> {
  const actual = await usuarioActual()
  const sub = actual.claims?.sub
  if (typeof sub !== 'string') return false
  const { endpoint, keys } = suscripcion
  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    endpoint.length > 1000 ||
    typeof keys?.p256dh !== 'string' ||
    typeof keys?.auth !== 'string'
  ) {
    return false
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('push_suscripciones')
    .upsert(
      { user_id: sub, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' }
    )
  if (error) {
    console.error('Error al guardar suscripción push:', error)
    return false
  }
  return true
}

/** Elimina la suscripción push de este navegador (por endpoint). */
export async function borrarSuscripcionPush(endpoint: string): Promise<void> {
  const actual = await usuarioActual()
  if (typeof actual.claims?.sub !== 'string') return
  if (typeof endpoint !== 'string' || !endpoint) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('push_suscripciones')
    .delete()
    .eq('endpoint', endpoint)
  if (error) console.error('Error al borrar suscripción push:', error)
}

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
