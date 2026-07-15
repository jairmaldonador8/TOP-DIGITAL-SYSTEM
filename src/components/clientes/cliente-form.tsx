'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { PencilLineIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  actualizarCliente,
  crearCliente,
} from '@/app/(app)/agencia/clientes/actions'
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
import { Textarea } from '@/components/ui/textarea'
import type { ResultadoAccion } from '@/lib/acciones'

/** Datos mínimos del cliente para precargar el formulario de edición. */
export type ClienteEditable = {
  id: string
  nombre_negocio: string
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  presupuesto_ads: number
  meta_facturacion: number
  notas: string | null
}

/**
 * Dialog de crear/editar cliente. Sin `cliente` renderiza el botón
 * "+ Nuevo cliente"; con `cliente` renderiza el botón "Editar" y precarga
 * los campos.
 */
export function ClienteFormDialog({ cliente }: { cliente?: ClienteEditable }) {
  const [abierto, setAbierto] = useState(false)
  // Cambia en cada apertura para remontar el formulario (estado limpio).
  const [epoca, setEpoca] = useState(0)
  const esEdicion = Boolean(cliente)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback(() => {
    toast.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado')
    setAbierto(false)
  }, [esEdicion])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger
        render={
          esEdicion ? (
            <Button variant="outline" />
          ) : (
            <Button />
          )
        }
      >
        {esEdicion ? <PencilLineIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        {esEdicion ? 'Editar' : 'Nuevo cliente'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? 'Actualiza los datos del negocio.'
              : 'Registra un negocio para empezar a darle seguimiento.'}
          </DialogDescription>
        </DialogHeader>
        <FormularioCliente key={epoca} cliente={cliente} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioCliente({
  cliente,
  alExito,
}: {
  cliente?: ClienteEditable
  alExito: () => void
}) {
  const accion = cliente ? actualizarCliente.bind(null, cliente.id) : crearCliente
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    accion,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  // React 19 resetea el <form> al terminar la action: repoblamos con los
  // valores capturados cuando hubo errores de validación.
  const inicial = (campo: string, base: string | number | null | undefined) =>
    valores[campo] ?? (base === null || base === undefined ? '' : String(base))

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo
        id="nombre_negocio"
        etiqueta="Nombre del negocio"
        error={errores.nombre_negocio}
      >
        <Input
          id="nombre_negocio"
          name="nombre_negocio"
          placeholder="Tacos El Patrón"
          defaultValue={inicial('nombre_negocio', cliente?.nombre_negocio)}
          aria-invalid={errores.nombre_negocio ? true : undefined}
          aria-describedby={describedBy('nombre_negocio', errores.nombre_negocio)}
          required
        />
      </Campo>

      <Campo
        id="contacto_nombre"
        etiqueta="Persona de contacto"
        error={errores.contacto_nombre}
      >
        <Input
          id="contacto_nombre"
          name="contacto_nombre"
          placeholder="Nombre y apellido"
          defaultValue={inicial('contacto_nombre', cliente?.contacto_nombre)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="email" etiqueta="Correo electrónico" error={errores.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contacto@negocio.mx"
            defaultValue={inicial('email', cliente?.email)}
            aria-invalid={errores.email ? true : undefined}
            aria-describedby={describedBy('email', errores.email)}
          />
        </Campo>
        <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono}>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="55 1234 5678"
            defaultValue={inicial('telefono', cliente?.telefono)}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="presupuesto_ads"
          etiqueta="Presupuesto de ads (MXN)"
          error={errores.presupuesto_ads}
        >
          <Input
            id="presupuesto_ads"
            name="presupuesto_ads"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            defaultValue={inicial('presupuesto_ads', cliente?.presupuesto_ads)}
            aria-invalid={errores.presupuesto_ads ? true : undefined}
            aria-describedby={describedBy(
              'presupuesto_ads',
              errores.presupuesto_ads
            )}
          />
        </Campo>
        <Campo
          id="meta_facturacion"
          etiqueta="Meta de facturación (MXN)"
          error={errores.meta_facturacion}
        >
          <Input
            id="meta_facturacion"
            name="meta_facturacion"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            defaultValue={inicial('meta_facturacion', cliente?.meta_facturacion)}
            aria-invalid={errores.meta_facturacion ? true : undefined}
            aria-describedby={describedBy(
              'meta_facturacion',
              errores.meta_facturacion
            )}
          />
        </Campo>
      </div>

      <Campo id="notas" etiqueta="Notas" error={errores.notas}>
        <Textarea
          id="notas"
          name="notas"
          rows={3}
          placeholder="Contexto del negocio, acuerdos, horarios…"
          defaultValue={inicial('notas', cliente?.notas)}
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
          {pendiente
            ? 'Guardando…'
            : cliente
              ? 'Guardar cambios'
              : 'Crear cliente'}
        </Button>
      </DialogFooter>
    </form>
  )
}
