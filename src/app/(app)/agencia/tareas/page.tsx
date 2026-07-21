import type { Metadata } from 'next'

import { ListaTareas, type TareaFila } from '@/components/tareas/lista-tareas'
import {
  TareaFormDialog,
  type ClienteOpcion,
} from '@/components/tareas/tarea-form'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Tareas',
}

type FilaTareaDb = {
  id: string
  titulo: string
  descripcion: string | null
  estado: 'pendiente' | 'en_progreso' | 'completada'
  fecha_limite: string | null
  clientes: { nombre_negocio: string } | null
}

export default async function PaginaTareas() {
  const supabase = await createClient()

  const [tareasRes, clientesRes] = await Promise.all([
    supabase
      .from('tareas')
      .select(
        'id, titulo, descripcion, estado, fecha_limite, clientes ( nombre_negocio )'
      )
      .order('estado', { ascending: true })
      .order('fecha_limite', { ascending: true, nullsFirst: false }),
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .order('nombre_negocio'),
  ])

  if (tareasRes.error) console.error('Error al cargar tareas:', tareasRes.error)
  if (clientesRes.error)
    console.error('Error al cargar clientes:', clientesRes.error)

  const tareas: TareaFila[] = (
    (tareasRes.data ?? []) as unknown as FilaTareaDb[]
  ).map((tarea) => ({
    id: tarea.id,
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    estado: tarea.estado,
    fecha_limite: tarea.fecha_limite,
    cliente: tarea.clientes?.nombre_negocio ?? 'Agencia',
  }))

  const activas = tareas.filter((tarea) => tarea.estado !== 'completada')
  const archivadas = tareas.filter((tarea) => tarea.estado === 'completada')
  const clientes = (clientesRes.data ?? []) as ClienteOpcion[]
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El trabajo interno de la agencia por cliente.
          </p>
        </div>
        <TareaFormDialog clientes={clientes} />
      </header>

      {tareasRes.error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar las tareas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : (
        <ListaTareas activas={activas} archivadas={archivadas} hoy={hoy} />
      )}
    </div>
  )
}
