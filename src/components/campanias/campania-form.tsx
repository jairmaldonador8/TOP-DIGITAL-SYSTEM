'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { crearCampania } from '@/app/(app)/agencia/campanias/actions'
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
import type { ResultadoAccion } from '@/lib/acciones'

export type ClienteOpcion = { id: string; nombre_negocio: string }

const PLATAFORMAS = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'WhatsApp',
  'Otra',
]

/** Dialog "+ Abrir campaña" del encabezado de la sección Campañas. */
export function CampaniaFormDialog({ clientes }: { clientes: ClienteOpcion[] }) {
  const [abierto, setAbierto] = useState(false)
  // Cambia en cada apertura para remontar el formulario (estado limpio).
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback(() => {
    toast.success('Campaña abierta 🚀')
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Abrir campaña
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir campaña</DialogTitle>
          <DialogDescription>
            Registra una campaña nueva; nace activa y el cliente la verá en
            su portal.
          </DialogDescription>
        </DialogHeader>
        <FormularioCampania key={epoca} clientes={clientes} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioCampania({
  clientes,
  alExito,
}: {
  clientes: ClienteOpcion[]
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearCampania,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="nombre" etiqueta="Nombre de la campaña" error={errores.nombre}>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Promo tacos 2x1 · julio"
          defaultValue={valores.nombre ?? ''}
          maxLength={200}
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={describedBy('nombre', errores.nombre)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="cliente_id" etiqueta="Cliente" error={errores.cliente_id}>
          <Select
            name="cliente_id"
            // Con un solo cliente posible (detalle de cliente) se preselecciona.
            defaultValue={
              valores.cliente_id ??
              (clientes.length === 1 ? clientes[0].id : null)
            }
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
          id="plataforma"
          etiqueta="Plataforma"
          descripcion="Opcional"
          error={errores.plataforma}
        >
          <Select
            name="plataforma"
            defaultValue={valores.plataforma ?? null}
            items={PLATAFORMAS.map((p) => ({ value: p, label: p }))}
          >
            <SelectTrigger id="plataforma" className="w-full">
              <SelectValue placeholder="¿Dónde corre?" />
            </SelectTrigger>
            <SelectContent>
              {PLATAFORMAS.map((plataforma) => (
                <SelectItem key={plataforma} value={plataforma}>
                  {plataforma}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="fecha_inicio"
          etiqueta="Fecha de inicio"
          descripcion="Opcional"
          error={errores.fecha_inicio}
        >
          <Input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={valores.fecha_inicio ?? ''}
            aria-invalid={errores.fecha_inicio ? true : undefined}
            aria-describedby={describedBy('fecha_inicio', errores.fecha_inicio)}
          />
        </Campo>
        <Campo
          id="presupuesto"
          etiqueta="Gasto inicial (MXN)"
          descripcion="Opcional, se puede ajustar después"
          error={errores.presupuesto}
        >
          <Input
            id="presupuesto"
            name="presupuesto"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            defaultValue={valores.presupuesto ?? ''}
            aria-invalid={errores.presupuesto ? true : undefined}
            aria-describedby={describedBy('presupuesto', errores.presupuesto)}
          />
        </Campo>
      </div>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Abriendo…' : 'Abrir campaña'}
        </Button>
      </DialogFooter>
    </form>
  )
}
