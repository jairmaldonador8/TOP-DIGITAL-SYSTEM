'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'

import { useCanalChat } from '@/lib/chat/use-canal'

export type ChatPendiente = {
  clienteId: string
  negocio: string
  cantidad: number
}

type Aviso = {
  clienteId: string
  negocio: string
  texto: string
}

const DURACION_AVISO_MS = 8000

/**
 * Notificaciones de chat para la agencia: cuando un cliente escribe aparece
 * un aviso arriba a la derecha («X te ha escrito»); el aviso se va solo a los
 * segundos, pero mientras haya mensajes sin responder queda un botón flotante
 * con el conteo — para que a Tadeo nunca se le pase contestar.
 */
export function NotificacionesAgencia({
  pendientes,
  miId,
}: {
  pendientes: ChatPendiente[]
  miId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [aviso, setAviso] = React.useState<Aviso | null>(null)

  useCanalChat({
    topico: 'chat:agencia',
    evento: 'nuevo_mensaje',
    onPayload: (payload) => {
      // El servidor recalcula los pendientes; el aviso solo es el "toque".
      router.refresh()
      if (payload.autor_id === miId) return
      setAviso({
        clienteId: String(payload.cliente_id ?? ''),
        negocio: String(payload.nombre_negocio ?? 'Un cliente'),
        texto: String(payload.texto ?? ''),
      })
    },
    onResync: () => router.refresh(),
  })

  // El aviso se retira solo; el botón flotante queda mientras haya pendientes.
  React.useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), DURACION_AVISO_MS)
    return () => clearTimeout(id)
  }, [aviso])

  const totalPendientes = pendientes.reduce(
    (suma, chat) => suma + chat.cantidad,
    0
  )
  // Dentro del hilo del cliente el aviso sobra: se está leyendo justo ahí.
  const enEseHilo = aviso && pathname === `/agencia/chats/${aviso.clienteId}`

  return (
    <>
      {aviso && !enEseHilo ? (
        <div className="animate-in fade-in slide-in-from-top-2 fixed top-20 right-4 z-50 duration-300">
          <div className="bg-marca rounded-2xl p-[1.5px] shadow-2xl">
            <div className="flex w-80 items-start gap-3 rounded-[calc(1rem-1.5px)] bg-card p-4">
              <span
                aria-hidden
                className="bg-marca flex size-9 shrink-0 items-center justify-center rounded-full text-white"
              >
                <MessageCircle className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {aviso.negocio} te ha escrito
                </p>
                {aviso.texto ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {aviso.texto}
                  </p>
                ) : null}
                <Link
                  href={`/agencia/chats/${aviso.clienteId}`}
                  onClick={() => setAviso(null)}
                  className="text-marca mt-1.5 inline-block text-xs font-semibold"
                >
                  Responder →
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setAviso(null)}
                aria-label="Cerrar aviso"
                className="rounded-full p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {totalPendientes > 0 ? (
        <Link
          href={
            pendientes.length === 1
              ? `/agencia/chats/${pendientes[0].clienteId}`
              : '/agencia/chats'
          }
          aria-label={`${totalPendientes} mensajes sin responder`}
          title={pendientes
            .map((chat) => `${chat.negocio} (${chat.cantidad})`)
            .join(', ')}
          className="group fixed right-4 bottom-4 z-50 outline-none"
        >
          <span
            aria-hidden
            className="bg-marca absolute inset-0 animate-ping rounded-full opacity-35"
          />
          <span className="bg-marca relative flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring/70">
            <MessageCircle aria-hidden className="size-6" />
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-marca-magenta shadow-md">
              {totalPendientes > 9 ? '9+' : totalPendientes}
            </span>
          </span>
        </Link>
      ) : null}
    </>
  )
}
