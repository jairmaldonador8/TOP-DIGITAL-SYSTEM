'use client'

import * as React from 'react'
import { BellOffIcon, BellRingIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  borrarSuscripcionPush,
  guardarSuscripcionPush,
} from '@/app/(app)/actions'
import { Button } from '@/components/ui/button'

/** La llave pública VAPID viaja en el bundle; sin ella el botón no aparece. */
const LLAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function base64AUint8(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binario.length))
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

/**
 * Botón del topbar para activar/desactivar notificaciones push en este
 * navegador. Registra /sw.js, pide permiso y guarda la suscripción; la
 * campanita in-app sigue funcionando aunque el usuario no active esto.
 */
export function ActivarPush() {
  // null = sin soporte o aún averiguando: el botón no se muestra.
  const [activo, setActivo] = React.useState<boolean | null>(null)
  const [trabajando, setTrabajando] = React.useState(false)

  React.useEffect(() => {
    if (!LLAVE_PUBLICA) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    let vivo = true
    navigator.serviceWorker
      .register('/sw.js')
      .then((registro) => registro.pushManager.getSubscription())
      .then((sub) => {
        if (!vivo) return
        setActivo(sub !== null)
        // Re-sincroniza en cada carga: si el navegador rotó la
        // suscripción (endpoint nuevo), el upsert la vuelve a guardar.
        const json = sub?.toJSON()
        if (json?.endpoint && json.keys?.p256dh && json.keys?.auth) {
          void guardarSuscripcionPush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          })
        }
      })
      .catch(() => {
        if (vivo) setActivo(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  if (activo === null) return null

  const activar = async () => {
    setTrabajando(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        toast.error('Tu navegador bloqueó las notificaciones')
        return
      }
      const registro = await navigator.serviceWorker.ready
      const sub = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64AUint8(LLAVE_PUBLICA as string),
      })
      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error('No se pudo activar, intenta de nuevo')
        return
      }
      const ok = await guardarSuscripcionPush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      })
      if (ok) {
        setActivo(true)
        toast.success('Notificaciones activadas en este dispositivo')
      } else {
        await sub.unsubscribe()
        toast.error('No se pudo activar, intenta de nuevo')
      }
    } catch (e) {
      console.error('Error al activar push:', e)
      toast.error('No se pudo activar, intenta de nuevo')
    } finally {
      setTrabajando(false)
    }
  }

  const desactivar = async () => {
    setTrabajando(true)
    try {
      const registro = await navigator.serviceWorker.ready
      const sub = await registro.pushManager.getSubscription()
      if (sub) {
        await borrarSuscripcionPush(sub.endpoint)
        await sub.unsubscribe()
      }
      setActivo(false)
      toast.success('Notificaciones desactivadas')
    } catch (e) {
      console.error('Error al desactivar push:', e)
      toast.error('No se pudo desactivar, intenta de nuevo')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={trabajando}
      onClick={() => void (activo ? desactivar() : activar())}
      aria-label={
        activo
          ? 'Desactivar notificaciones en este dispositivo'
          : 'Activar notificaciones en este dispositivo'
      }
      title={
        activo ? 'Notificaciones activadas' : 'Activar notificaciones push'
      }
    >
      {activo ? (
        <BellRingIcon aria-hidden className="size-4 text-marca-magenta" />
      ) : (
        <BellOffIcon aria-hidden className="size-4 text-muted-foreground" />
      )}
    </Button>
  )
}
