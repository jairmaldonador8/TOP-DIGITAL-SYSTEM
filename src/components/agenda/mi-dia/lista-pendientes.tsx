'use client'

import * as React from 'react'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import { cambiarEstadoTarea } from '@/app/(app)/agencia/tareas/actions'
import type { PendienteDia } from '@/lib/agenda/tipos'
import { cn } from '@/lib/utils'

/**
 * "Deshacer" del toast: regresa el pendiente a su estado previo
 * (pendiente o en progreso) y lo destacha. La revalidación de la acción
 * refresca Mi día, y es ese refresco el que trae la fila de vuelta.
 */
async function restaurarDesdeToast(
  id: string,
  estadoPrevio: PendienteDia['estado'],
  alRestaurar: () => void
) {
  const resultado = await cambiarEstadoTarea(id, estadoPrevio)
  if (resultado.ok) {
    alRestaurar()
    toast.success('Pendiente restaurado')
  } else {
    toast.error(resultado.mensaje)
  }
}

/** Pendientes de hoy (y atrasados/sin fecha) con palomita de completar. */
export function ListaPendientes({ pendientes }: { pendientes: PendienteDia[] }) {
  if (pendientes.length === 0) {
    return (
      <p className="flex min-h-12 items-center rounded-2xl border border-dashed border-border bg-card/60 px-4 text-sm text-muted-foreground">
        Nada pendiente ✨
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/60 bg-card px-2">
      {pendientes.map((p) => (
        <FilaPendiente key={p.id} pendiente={p} />
      ))}
    </ul>
  )
}

function FilaPendiente({ pendiente }: { pendiente: PendienteDia }) {
  const [hecho, setHecho] = React.useState(false)
  const [guardando, setGuardando] = React.useState(false)

  const completar = async () => {
    if (hecho || guardando) return
    setHecho(true) // optimista: tachado al instante
    setGuardando(true)
    const resultado = await cambiarEstadoTarea(pendiente.id, 'completada')
    setGuardando(false)
    if (resultado.ok) {
      toast.success('Listo ✅', {
        action: {
          label: 'Deshacer',
          onClick: () => void restaurarDesdeToast(pendiente.id, pendiente.estado, () => setHecho(false)),
        },
      })
    } else {
      setHecho(false)
      toast.error(resultado.mensaje)
    }
  }

  return (
    <li className={cn('flex min-h-12 items-center gap-1 pr-2 transition-opacity duration-300', hecho && 'opacity-50')}>
      <button
        type="button"
        onClick={completar}
        disabled={hecho}
        aria-label={`Completar ${pendiente.titulo}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full border-2 transition-all duration-300',
            hecho ? 'bg-marca scale-110 border-transparent' : 'border-muted-foreground/50'
          )}
        >
          <CheckIcon aria-hidden className={cn('size-3.5 text-white transition-opacity', hecho ? 'opacity-100' : 'opacity-0')} />
        </span>
      </button>
      <span className={cn('min-w-0 flex-1 py-2 text-sm leading-snug', hecho && 'text-muted-foreground line-through')}>
        {pendiente.titulo}
      </span>
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        {pendiente.cliente ? (
          <span className="max-w-28 truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {pendiente.cliente}
          </span>
        ) : null}
        {pendiente.atrasado ? (
          <span className="rounded-full bg-marca-naranja/15 px-2 py-0.5 text-[11px] font-semibold text-marca-naranja">
            atrasado
          </span>
        ) : pendiente.hora ? (
          <span className="rounded-full bg-marca-violeta/20 px-2 py-0.5 text-[11px] font-semibold text-marca-violeta tabular-nums">
            hoy {pendiente.hora}
          </span>
        ) : null}
      </span>
    </li>
  )
}
