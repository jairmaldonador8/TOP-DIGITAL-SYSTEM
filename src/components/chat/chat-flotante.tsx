'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'

import {
  FormularioMensaje,
  HiloMensajes,
  type Mensaje,
} from '@/components/chat/hilo'
import { useCanalChat } from '@/lib/chat/use-canal'
import { cn } from '@/lib/utils'

type ChatFlotanteProps = {
  clienteId: string
  mensajes: Mensaje[]
  /** Mensajes recibidos aún no leídos (calculado en el servidor). */
  noLeidos: number
  miId: string | null
  action: (formData: FormData) => Promise<void>
  marcarLeidos: () => Promise<void>
  /** Canal de realtime; default: el hilo del cliente (portal). */
  topico?: string
  /** Encabezado del panel; defaults = chat del portal con Tadeo. */
  titulo?: string
  subtitulo?: string
  inicialAvatar?: string
}

/**
 * Chat flotante del portal: botón animado en la esquina inferior derecha que
 * abre el hilo con Tadeo (dueño de la agencia) sin salir de la página.
 * Escucha el canal privado del cliente: cada mensaje nuevo refresca los datos
 * del servidor (y el globito de no leídos) al instante.
 */
export function ChatFlotante({
  clienteId,
  mensajes,
  noLeidos,
  miId,
  action,
  marcarLeidos,
  topico,
  titulo = 'Tadeo',
  subtitulo = 'Top Digital · te responde personalmente',
  inicialAvatar = 'T',
}: ChatFlotanteProps) {
  const router = useRouter()
  const [abierto, setAbierto] = React.useState(false)
  const hiloRef = React.useRef<HTMLDivElement>(null)

  useCanalChat({
    topico: topico ?? (clienteId ? `chat:${clienteId}` : null),
    evento: 'INSERT',
    // El servidor es la fuente de verdad: un refresh trae mensajes y conteo.
    onPayload: () => router.refresh(),
    onResync: () => router.refresh(),
  })

  // Con el panel abierto, lo recibido se marca leído (también lo que va llegando).
  React.useEffect(() => {
    if (abierto && noLeidos > 0) void marcarLeidos()
  }, [abierto, noLeidos, marcarLeidos])

  // Al abrir (y con cada mensaje nuevo) el hilo baja hasta lo más reciente.
  React.useEffect(() => {
    if (abierto && hiloRef.current) {
      hiloRef.current.scrollTop = hiloRef.current.scrollHeight
    }
  }, [abierto, mensajes.length])

  // La tarjeta "Chat directo" del dashboard también abre este panel.
  React.useEffect(() => {
    const abrir = () => setAbierto(true)
    window.addEventListener('abrir-chat-portal', abrir)
    return () => window.removeEventListener('abrir-chat-portal', abrir)
  }, [])

  return (
    <>
      {abierto ? (
        <section
          aria-label={`Chat con ${titulo}`}
          className="fixed right-4 bottom-24 z-50 flex max-h-[min(560px,calc(100svh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <header className="bg-marca flex items-center gap-3 px-4 py-3 text-white">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold"
            >
              {inicialAvatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{titulo}</p>
              <p className="truncate text-xs text-white/85">{subtitulo}</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1.5 outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X aria-hidden className="size-4" />
            </button>
          </header>

          <div ref={hiloRef} className="min-h-56 flex-1 overflow-y-auto px-4 py-4">
            <HiloMensajes mensajes={mensajes} miId={miId} />
          </div>

          <div className="border-t border-border px-3 py-3">
            <FormularioMensaje action={action} />
          </div>
        </section>
      ) : null}

      <button
        type="button"
        data-tour="chat"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-label={
          abierto
            ? 'Cerrar chat'
            : `Abrir chat con ${titulo}${noLeidos > 0 ? ` (${noLeidos} mensajes nuevos)` : ''}`
        }
        className="group fixed right-4 bottom-4 z-50 outline-none"
      >
        {/* Aro animado: llama la atención hasta que se abre el chat. */}
        {!abierto ? (
          <span
            aria-hidden
            className="bg-marca absolute inset-0 animate-ping rounded-full opacity-35"
          />
        ) : null}
        <span
          className={cn(
            'bg-marca relative flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200',
            'group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring/70'
          )}
        >
          {abierto ? (
            <X aria-hidden className="size-6" />
          ) : (
            <MessageCircle aria-hidden className="size-6" />
          )}
          {/* Globito de no leídos */}
          {!abierto && noLeidos > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-marca-magenta shadow-md">
              {noLeidos > 9 ? '9+' : noLeidos}
            </span>
          ) : null}
        </span>
      </button>
    </>
  )
}
