'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { crearEvento } from '@/app/(app)/agencia/calendario/actions'
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

export type ClienteOpcionCal = { id: string; nombre_negocio: string }

export const TIPOS_EVENTO = [
  { value: 'junta', label: 'Junta' },
  { value: 'sesion', label: 'Sesión (fotos/video)' },
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'pago', label: 'Pago' },
  { value: 'otro', label: 'Otro' },
]

/** Dialog "+ Evento" del calendario de operación. */
export function EventoFormDialog({ clientes }: { clientes: ClienteOpcionCal[] }) {
  const [abierto, setAbierto] = useState(false)
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback(() => {
    toast.success('Evento agendado 📅')
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Evento
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
          <DialogDescription>
            Juntas, sesiones, lanzamientos, pagos — lo que necesite fecha.
          </DialogDescription>
        </DialogHeader>
        <FormularioEvento key={epoca} clientes={clientes} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioEvento({
  clientes,
  alExito,
}: {
  clientes: ClienteOpcionCal[]
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearEvento,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Sesión de fotos · nuevos productos"
          defaultValue={valores.titulo ?? ''}
          maxLength={200}
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={describedBy('titulo', errores.titulo)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" etiqueta="Tipo" error={errores.tipo}>
          <Select
            name="tipo"
            defaultValue={valores.tipo ?? 'junta'}
            items={TIPOS_EVENTO}
          >
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EVENTO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo
          id="cliente_id"
          etiqueta="Cliente"
          descripcion="Opcional"
          error={errores.cliente_id}
        >
          <Select
            name="cliente_id"
            defaultValue={valores.cliente_id ?? null}
            items={clientes.map((c) => ({
              value: c.id,
              label: c.nombre_negocio,
            }))}
          >
            <SelectTrigger id="cliente_id" className="w-full">
              <SelectValue placeholder="¿De qué cliente?" />
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={valores.fecha ?? ''}
            aria-invalid={errores.fecha ? true : undefined}
            aria-describedby={describedBy('fecha', errores.fecha)}
            required
          />
        </Campo>
        <Campo
          id="hora"
          etiqueta="Hora"
          descripcion="Vacía = todo el día"
          error={errores.hora}
        >
          <Input
            id="hora"
            name="hora"
            type="time"
            defaultValue={valores.hora ?? ''}
            aria-invalid={errores.hora ? true : undefined}
            aria-describedby={describedBy('hora', errores.hora)}
          />
        </Campo>
      </div>

      <Campo
        id="descripcion"
        etiqueta="Notas"
        descripcion="Opcional"
        error={errores.descripcion}
      >
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          placeholder="Dirección, pendientes, links…"
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
          {pendiente ? 'Agendando…' : 'Agendar'}
        </Button>
      </DialogFooter>
    </form>
  )
}
