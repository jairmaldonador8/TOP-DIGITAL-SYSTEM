'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'

type OpcionesCanal = {
  /** Tópico privado (p. ej. `chat:<cliente_id>`); null desactiva el canal. */
  topico: string | null
  /** Nombre del evento broadcast a escuchar. */
  evento: string
  /** Llega el payload de cada evento del canal. */
  onPayload: (payload: Record<string, unknown>) => void
  /**
   * La reconexión NO reenvía lo perdido: aquí se debe re-sincronizar
   * (normalmente router.refresh()).
   */
  onResync?: () => void
}

/**
 * Suscripción a un canal privado de Realtime (Broadcast). Requiere setAuth()
 * antes de unirse; la RLS sobre realtime.messages decide quién puede entrar.
 */
export function useCanalChat({
  topico,
  evento,
  onPayload,
  onResync,
}: OpcionesCanal) {
  // Refs para no re-suscribir cuando cambian las funciones entre renders.
  const onPayloadRef = React.useRef(onPayload)
  const onResyncRef = React.useRef(onResync)
  React.useEffect(() => {
    onPayloadRef.current = onPayload
    onResyncRef.current = onResync
  })

  React.useEffect(() => {
    if (!topico) return
    const supabase = createClient()
    let activo = true
    let caido = false
    let canal: ReturnType<typeof supabase.channel> | null = null

    void supabase.realtime.setAuth().then(() => {
      if (!activo) return
      canal = supabase
        .channel(topico, { config: { private: true } })
        .on('broadcast', { event: evento }, ({ payload }) => {
          onPayloadRef.current(payload as Record<string, unknown>)
        })
        .subscribe((estado) => {
          if (estado === 'SUBSCRIBED') {
            if (caido) onResyncRef.current?.()
            caido = false
          } else {
            caido = true
          }
        })
    })

    return () => {
      activo = false
      if (canal) void supabase.removeChannel(canal)
    }
  }, [topico, evento])
}
