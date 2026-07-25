/**
 * Envío de notificaciones Web Push (spec 2026-07-25). Usa el cliente
 * admin (el envío cruza usuarios: un trabajador dispara el push del
 * dueño y viceversa) y limpia suscripciones muertas (404/410).
 *
 * Sin llaves VAPID configuradas todo es un no-op silencioso: la app
 * funciona igual, solo no hay push.
 */
import 'server-only'

import { after } from 'next/server'
import webpush from 'web-push'

import { createAdminClient } from '@/lib/supabase/admin'

export type PayloadPush = {
  titulo: string
  cuerpo: string
  /** Ruta destino al tocar la notificación (p. ej. '/equipo'). */
  url: string
}

let configurado: boolean | null = null

function vapidListo(): boolean {
  if (configurado !== null) return configurado
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  if (!publica || !privada) {
    configurado = false
    return false
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:hola@topdigital.company',
    publica,
    privada
  )
  configurado = true
  return true
}

async function enviarAhora(
  userIds: string[],
  payload: PayloadPush
): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: suscripciones, error } = await admin
      .from('push_suscripciones')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', userIds)
    if (error || !suscripciones || suscripciones.length === 0) {
      if (error) console.error('Error al leer suscripciones push:', error)
      return
    }

    const cuerpo = JSON.stringify(payload)
    const muertas: string[] = []
    await Promise.all(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            cuerpo,
            // Sin timeout, un endpoint colgado detendría el envío para
            // siempre (web-push no pone uno por defecto).
            { timeout: 5000, TTL: 300 }
          )
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) muertas.push(s.id)
          else console.error('Error al enviar push:', e)
        }
      })
    )

    if (muertas.length > 0) {
      await admin.from('push_suscripciones').delete().in('id', muertas)
    }
  } catch (e) {
    console.error('Error inesperado al enviar push:', e)
  }
}

/**
 * Envía el payload a todas las suscripciones de los usuarios dados.
 * Best-effort y NO bloqueante: el trabajo real corre con `after()`
 * cuando la respuesta ya salió; nunca lanza ni retrasa la action.
 */
export async function enviarPushA(
  userIds: string[],
  payload: PayloadPush
): Promise<void> {
  if (userIds.length === 0 || !vapidListo()) return
  try {
    after(() => enviarAhora(userIds, payload))
  } catch {
    // Fuera de un request (p. ej. scripts): enviar directo.
    await enviarAhora(userIds, payload)
  }
}

/** user_ids de todos los admins (para avisos dirigidos al dueño). */
export async function idsAdmins(): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('usuarios')
    .select('user_id')
    .eq('rol', 'admin')
  if (error) {
    console.error('Error al listar admins para push:', error)
    return []
  }
  return (data ?? []).map((u) => u.user_id as string)
}
