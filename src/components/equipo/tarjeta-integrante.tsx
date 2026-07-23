'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircleIcon, PencilIcon } from 'lucide-react'

import {
  enviarMensajeATrabajador,
  marcarLeidosDeTrabajador,
} from '@/app/(app)/agencia/equipo/actions'
import {
  FormularioMensaje,
  HiloMensajes,
  type Mensaje,
} from '@/components/chat/hilo'
import {
  EditarEncargoDialog,
  type ClienteOpcionEquipo,
  type EncargoEditable,
  type TrabajadorOpcion,
} from '@/components/equipo/formularios-equipo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCanalChat } from '@/lib/chat/use-canal'
import type { EstadoEncargo } from '@/lib/equipo/transiciones'

const ETIQUETA_ESTADO: Record<EstadoEncargo, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  entregado: 'En revisión',
  cambios: 'Cambios',
  aprobado: 'Aprobado',
}

export type EncargoDeIntegrante = EncargoEditable & { estado: EstadoEncargo }

/**
 * Tarjeta del integrante en /agencia/equipo: conteos, chat 1:1 en tiempo
 * real y lista de encargos con edición (los aprobados son solo lectura).
 * Una sola suscripción de realtime por integrante (evita canales duplicados).
 */
export function TarjetaIntegrante({
  userId,
  nombre,
  puesto,
  activos,
  porRevisar,
  aprobados,
  mensajes,
  noLeidos,
  miId,
  encargos,
  trabajadores,
  clientes,
}: {
  userId: string
  nombre: string
  puesto: string
  activos: number
  porRevisar: number
  aprobados: number
  mensajes: Mensaje[]
  noLeidos: number
  miId: string | null
  encargos: EncargoDeIntegrante[]
  trabajadores: TrabajadorOpcion[]
  clientes: ClienteOpcionEquipo[]
}) {
  const router = useRouter()
  const [chatAbierto, setChatAbierto] = React.useState(false)
  const [encargosAbierto, setEncargosAbierto] = React.useState(false)
  const [editando, setEditando] = React.useState<EncargoEditable | null>(null)
  const hiloRef = React.useRef<HTMLDivElement>(null)

  useCanalChat({
    topico: `chat:equipo:${userId}`,
    evento: 'INSERT',
    onPayload: () => router.refresh(),
    onResync: () => router.refresh(),
  })

  React.useEffect(() => {
    if (chatAbierto && noLeidos > 0) void marcarLeidosDeTrabajador(userId)
  }, [chatAbierto, noLeidos, userId])

  React.useEffect(() => {
    if (chatAbierto && hiloRef.current) {
      hiloRef.current.scrollTop = hiloRef.current.scrollHeight
    }
  }, [chatAbierto, mensajes.length])

  const enviar = enviarMensajeATrabajador.bind(null, userId)

  return (
    <>
      <Card className="gap-3 px-4 py-4">
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setEncargosAbierto(true)}
              className="min-w-0 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <p className="truncate text-sm font-semibold hover:underline">
                {nombre}
              </p>
              <p className="text-xs text-muted-foreground">{puesto}</p>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              {porRevisar > 0 ? (
                <span className="bg-marca inline-flex h-5 items-center rounded-4xl px-2 text-xs font-semibold whitespace-nowrap text-white">
                  {porRevisar} por revisar
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Chat con ${nombre}${noLeidos > 0 ? ` (${noLeidos} sin leer)` : ''}`}
                onClick={() => setChatAbierto(true)}
                className="relative"
              >
                <MessageCircleIcon aria-hidden />
                {noLeidos > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-marca-magenta px-1 text-[10px] font-bold text-white">
                    {noLeidos > 9 ? '9+' : noLeidos}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {activos} {activos === 1 ? 'activo' : 'activos'} · {aprobados}{' '}
            {aprobados === 1 ? 'aprobado' : 'aprobados'}
          </p>
        </CardContent>
      </Card>

      {/* Chat 1:1 */}
      <Dialog open={chatAbierto} onOpenChange={setChatAbierto}>
        <DialogContent className="flex max-h-[min(600px,85svh)] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat con {nombre}</DialogTitle>
            <DialogDescription>{puesto}</DialogDescription>
          </DialogHeader>
          <div ref={hiloRef} className="min-h-48 flex-1 overflow-y-auto py-2">
            <HiloMensajes mensajes={mensajes} miId={miId} />
          </div>
          <div className="border-t border-border pt-3">
            <FormularioMensaje action={enviar} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Encargos del integrante */}
      <Dialog open={encargosAbierto} onOpenChange={setEncargosAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Encargos de {nombre}</DialogTitle>
            <DialogDescription>
              Toca el lápiz para editar los que aún no están aprobados.
            </DialogDescription>
          </DialogHeader>
          {encargos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin encargos todavía.
            </p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {encargos.map((encargo) => (
                <li
                  key={encargo.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {encargo.titulo}
                    </p>
                    <Badge variant="secondary" className="mt-0.5">
                      {ETIQUETA_ESTADO[encargo.estado]}
                    </Badge>
                  </div>
                  {encargo.estado !== 'aprobado' ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${encargo.titulo}`}
                      onClick={() => {
                        setEncargosAbierto(false)
                        setEditando(encargo)
                      }}
                    >
                      <PencilIcon aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <EditarEncargoDialog
        encargo={editando}
        trabajadores={trabajadores}
        clientes={clientes}
        onCerrar={() => setEditando(null)}
      />
    </>
  )
}
