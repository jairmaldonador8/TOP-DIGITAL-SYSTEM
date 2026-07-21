'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { crearTarea } from '@/app/(app)/agencia/tareas/actions'
import { Campo, describedBy } from '@/components/formularios/campo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ResultadoAccion } from '@/lib/acciones'

export type ClienteOpcion = { id: string; nombre_negocio: string }

/** Dialog "+ Nueva tarea" del encabezado de la sección Tareas. */
export function TareaFormDialog({ clientes }: { clientes: ClienteOpcion[] }) {
  const [abierto, setAbierto] = useState(false)
  // Cambia en cada apertura para remontar el formulario (estado limpio).
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback(() => {
    toast.success('Tarea creada')
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Nueva tarea
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Anota un pendiente del equipo y de qué cliente es.
          </DialogDescription>
        </DialogHeader>
        <FormularioTarea key={epoca} clientes={clientes} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioTarea({
  clientes,
  alExito,
}: {
  clientes: ClienteOpcion[]
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearTarea,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="titulo" etiqueta="¿Qué hay que hacer?" error={errores.titulo}>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Preparar el reporte mensual de campañas"
          defaultValue={valores.titulo ?? ''}
          maxLength={200}
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={describedBy('titulo', errores.titulo)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="cliente_id" etiqueta="Cliente" error={errores.cliente_id}>
          <Select
            name="cliente_id"
            defaultValue={valores.cliente_id ?? null}
            items={clientes.map((c) => ({
              value: c.id,
              label: c.nombre_negocio,
            }))}
          >
            <SelectTrigger
              id="cliente_id"
              className="w-full"
              aria-invalid={errores.cliente_id ? true : undefined}
              aria-describedby={describedBy('cliente_id', errores.cliente_id)}
            >
              <SelectValue placeholder="Elige un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre_negocio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo
          id="fecha_limite"
          etiqueta="Fecha límite"
          descripcion="Opcional"
          error={errores.fecha_limite}
        >
          <Input
            id="fecha_limite"
            name="fecha_limite"
            type="date"
            defaultValue={valores.fecha_limite ?? ''}
            aria-invalid={errores.fecha_limite ? true : undefined}
            aria-describedby={describedBy('fecha_limite', errores.fecha_limite)}
          />
        </Campo>
      </div>

      <Campo
        id="descripcion"
        etiqueta="Descripción"
        descripcion="Opcional"
        error={errores.descripcion}
      >
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          placeholder="Contexto, enlaces, acuerdos…"
          defaultValue={valores.descripcion ?? ''}
        />
      </Campo>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Crear tarea'}
        </Button>
      </DialogFooter>
    </form>
  )
}
