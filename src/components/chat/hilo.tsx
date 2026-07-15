import { SendIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatoFechaHora } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type Mensaje = {
  id: string
  autor_id: string | null
  autor_nombre: string | null
  texto: string
  created_at: string
}

/**
 * Hilo de conversación: los mensajes propios (autor_id === miId) van a la
 * derecha con el degradado de marca; los del otro lado, en tarjeta neutra.
 * Versión con recarga por server action; el realtime llega en la fase 3.
 */
export function HiloMensajes({
  mensajes,
  miId,
}: {
  mensajes: Mensaje[]
  miId: string | null
}) {
  if (mensajes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Todavía no hay mensajes. Escribe el primero para iniciar la
        conversación.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {mensajes.map((mensaje) => {
        const propio = mensaje.autor_id === miId
        return (
          <li
            key={mensaje.id}
            className={cn('flex', propio ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                propio
                  ? 'bg-marca rounded-br-md text-white'
                  : 'rounded-bl-md bg-secondary'
              )}
            >
              {!propio && mensaje.autor_nombre ? (
                <p className="mb-0.5 text-xs font-semibold text-marca-magenta">
                  {mensaje.autor_nombre}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{mensaje.texto}</p>
              <p
                className={cn(
                  'mt-1 text-right text-[10px]',
                  propio ? 'text-white/75' : 'text-muted-foreground'
                )}
              >
                {formatoFechaHora(mensaje.created_at)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Formulario de envío. React 19 limpia el input al completar la action. */
export function FormularioMensaje({
  action,
}: {
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <Input
        name="texto"
        placeholder="Escribe un mensaje…"
        autoComplete="off"
        maxLength={2000}
        required
        className="flex-1"
      />
      <Button type="submit" size="icon" className="bg-marca shrink-0 border-0">
        <SendIcon aria-hidden />
        <span className="sr-only">Enviar</span>
      </Button>
    </form>
  )
}
