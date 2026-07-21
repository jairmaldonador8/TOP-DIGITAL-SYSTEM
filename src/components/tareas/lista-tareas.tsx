'use client'

import * as React from 'react'
import {
  CheckIcon,
  ChevronRightIcon,
  ListChecksIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { cambiarEstadoTarea } from '@/app/(app)/agencia/tareas/actions'
import { Card, CardContent } from '@/components/ui/card'
import { formatoFechaCorta } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type TareaFila = {
  id: string
  titulo: string
  descripcion: string | null
  estado: 'pendiente' | 'en_progreso' | 'completada'
  fecha_limite: string | null
  cliente: string
}

const ESTILOS_ESTADO = {
  pendiente: 'bg-marca-naranja/15 text-marca-naranja',
  en_progreso: 'bg-marca-violeta/20 text-marca-violeta',
} as const

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
} as const

/** "Deshacer" del toast: regresa la tarea recién completada a pendiente. */
async function restaurarDesdeToast(id: string) {
  const resultado = await cambiarEstadoTarea(id, 'pendiente')
  if (resultado.ok) toast.success('Tarea restaurada')
  else toast.error(resultado.mensaje)
}

/**
 * Lista de tareas con interacción de completar: la palomita se dibuja, el
 * título se tacha con un barrido, la fila se pliega y la tarea aparece en
 * la sección Archivadas, con "Deshacer" en el toast.
 */
export function ListaTareas({
  activas,
  archivadas,
  hoy,
}: {
  activas: TareaFila[]
  archivadas: TareaFila[]
  hoy: string
}) {
  return (
    <>
      {activas.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ListChecksIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              {archivadas.length > 0 ? 'Todo al día ✨' : 'Sin tareas por ahora'}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {archivadas.length > 0
                ? 'No queda nada pendiente. Crea una tarea nueva cuando haga falta.'
                : 'Crea la primera con el botón "Nueva tarea".'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="py-2">
          <CardContent className="px-6">
            <ul className="flex flex-col divide-y divide-border">
              {activas.map((tarea) => (
                // La key incluye el estado: si la tarea cambia (p. ej. un
                // "Deshacer"), la fila se remonta con la animación limpia.
                <FilaActiva
                  key={`${tarea.id}-${tarea.estado}`}
                  tarea={tarea}
                  hoy={hoy}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {archivadas.length > 0 ? <Archivadas tareas={archivadas} /> : null}
    </>
  )
}

function FilaActiva({ tarea, hoy }: { tarea: TareaFila; hoy: string }) {
  const [fase, setFase] = React.useState<'normal' | 'completando' | 'saliendo'>(
    'normal'
  )
  const completando = fase !== 'normal'

  const completar = () => {
    if (completando) return
    setFase('completando')
    // La animación nunca espera a la red: palomita + tachado (800ms), la
    // fila se pliega (400ms) y hasta entonces se persiste el cambio.
    window.setTimeout(() => setFase('saliendo'), 800)
    window.setTimeout(async () => {
      const resultado = await cambiarEstadoTarea(tarea.id, 'completada')
      if (resultado.ok) {
        toast.success('Tarea completada', {
          action: {
            label: 'Deshacer',
            onClick: () => void restaurarDesdeToast(tarea.id),
          },
        })
      } else {
        setFase('normal')
        toast.error(resultado.mensaje)
      }
    }, 1250)
  }

  const vencida = tarea.fecha_limite !== null && tarea.fecha_limite < hoy

  return (
    <li
      className={cn(
        'grid grid-rows-[1fr] opacity-100 transition-all duration-400 ease-out',
        fase === 'saliendo' && 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            'flex items-start gap-3 py-4 transition-transform duration-400',
            fase === 'saliendo' && 'translate-x-8'
          )}
        >
          <button
            type="button"
            onClick={completar}
            disabled={completando}
            aria-label={`Marcar «${tarea.titulo}» como completada`}
            className={cn(
              'group/palomita mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300',
              completando
                ? 'bg-marca scale-110 border-transparent'
                : 'border-muted-foreground/40 hover:border-marca-magenta/70'
            )}
          >
            <svg viewBox="0 0 12 12" aria-hidden className="size-3">
              <path
                d="M2.5 6.5 5 9l4.5-5.5"
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  completando
                    ? 'animar-trazo text-white'
                    : 'text-muted-foreground opacity-0 transition-opacity group-hover/palomita:opacity-50'
                )}
              />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'font-medium transition-colors duration-300',
                completando && 'tachado-animado text-muted-foreground'
              )}
            >
              {tarea.titulo}
            </p>
            {tarea.descripcion ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {tarea.descripcion}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {tarea.cliente}
              {tarea.fecha_limite ? (
                <span className={cn(vencida && 'text-destructive')}>
                  {' '}
                  · vence {formatoFechaCorta(tarea.fecha_limite)}
                  {vencida ? ' (vencida)' : ''}
                </span>
              ) : null}
            </p>
          </div>

          {tarea.estado !== 'completada' ? (
            <span
              className={cn(
                'inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-xs font-medium transition-opacity duration-300',
                ESTILOS_ESTADO[tarea.estado],
                completando && 'opacity-0'
              )}
            >
              {ETIQUETAS_ESTADO[tarea.estado]}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function Archivadas({ tareas }: { tareas: TareaFila[] }) {
  const [abierto, setAbierto] = React.useState(false)
  const [restaurando, setRestaurando] = React.useState<string | null>(null)

  const restaurar = async (tarea: TareaFila) => {
    if (restaurando) return
    setRestaurando(tarea.id)
    const resultado = await cambiarEstadoTarea(tarea.id, 'pendiente')
    if (resultado.ok) toast.success('Tarea restaurada')
    else toast.error(resultado.mensaje)
    setRestaurando(null)
  }

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRightIcon
          aria-hidden
          className={cn(
            'size-4 transition-transform duration-300',
            abierto && 'rotate-90'
          )}
        />
        Archivadas · {tareas.length}
      </button>

      <div
        inert={!abierto}
        className={cn(
          'grid transition-[grid-template-rows] duration-500 ease-out',
          abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <Card className="py-2">
            <CardContent className="px-6">
              <ul className="flex flex-col divide-y divide-border">
                {tareas.map((tarea) => (
                  <li
                    key={tarea.id}
                    className={cn(
                      'flex items-start gap-3 py-4 transition-opacity duration-300',
                      restaurando === tarea.id && 'opacity-40'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void restaurar(tarea)}
                      disabled={restaurando !== null}
                      aria-label={`Restaurar «${tarea.titulo}» a pendientes`}
                      title="Restaurar a pendientes"
                      className="group/restaurar bg-marca mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-110"
                    >
                      <CheckIcon
                        aria-hidden
                        className="size-3 group-hover/restaurar:hidden"
                      />
                      <RotateCcwIcon
                        aria-hidden
                        className="hidden size-3 group-hover/restaurar:block"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-muted-foreground line-through">
                        {tarea.titulo}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {tarea.cliente}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
