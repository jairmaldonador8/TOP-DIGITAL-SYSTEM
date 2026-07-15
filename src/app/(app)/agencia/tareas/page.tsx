import type { Metadata } from 'next'
import { ListChecksIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatoFechaCorta } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Tareas',
}

type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada'

type FilaTarea = {
  id: string
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  fecha_limite: string | null
  clientes: { nombre_negocio: string } | null
}

const ESTILOS_ESTADO: Record<EstadoTarea, string> = {
  pendiente: 'bg-marca-naranja/15 text-marca-naranja',
  en_progreso: 'bg-marca-violeta/20 text-marca-violeta',
  completada: 'bg-marca text-white',
}

const ETIQUETAS_ESTADO: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
}

export default async function PaginaTareas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tareas')
    .select(
      'id, titulo, descripcion, estado, fecha_limite, clientes ( nombre_negocio )'
    )
    .order('estado', { ascending: true })
    .order('fecha_limite', { ascending: true, nullsFirst: false })

  if (error) console.error('Error al cargar tareas:', error)
  const tareas = (data ?? []) as unknown as FilaTarea[]
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El trabajo interno de la agencia por cliente.
        </p>
      </header>

      {error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar las tareas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : tareas.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ListChecksIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Sin tareas por ahora</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Las tareas internas del equipo aparecerán aquí.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="py-2">
          <CardContent className="px-6">
            <ul className="flex flex-col">
              {tareas.map((tarea) => {
                const vencida =
                  tarea.estado !== 'completada' &&
                  tarea.fecha_limite !== null &&
                  tarea.fecha_limite < hoy
                return (
                  <li
                    key={tarea.id}
                    className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-0"
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'font-medium',
                          tarea.estado === 'completada' &&
                            'text-muted-foreground line-through'
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
                        {tarea.clientes?.nombre_negocio ?? 'Agencia'}
                        {tarea.fecha_limite ? (
                          <span
                            className={cn(vencida && 'text-destructive')}
                          >
                            {' '}
                            · vence {formatoFechaCorta(tarea.fecha_limite)}
                            {vencida ? ' (vencida)' : ''}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-xs font-medium',
                        ESTILOS_ESTADO[tarea.estado]
                      )}
                    >
                      {ETIQUETAS_ESTADO[tarea.estado]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
