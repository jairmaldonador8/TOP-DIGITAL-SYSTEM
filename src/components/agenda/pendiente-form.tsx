'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { crearPendiente } from '@/app/(app)/agencia/agenda/actions'
import type { ClienteOpcionCita } from '@/components/agenda/cita-form'
import { Campo, describedBy } from '@/components/formularios/campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResultadoAccion } from '@/lib/acciones'

/** Formulario corto de pendiente (tarea de agenda), para la hoja "+". */
export function PendienteForm({
  clientes,
  hoy,
  alExito,
}: {
  clientes: ClienteOpcionCita[]
  hoy: string
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearPendiente,
    null
  )

  useEffect(() => {
    if (estado?.ok) {
      toast.success('Pendiente anotado ✅')
      alExito()
    }
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <Input
          id="titulo"
          name="titulo"
          className="h-11 text-base md:text-base"
          placeholder="Llamar al cliente, mandar propuesta…"
          defaultValue={valores.titulo ?? ''}
          maxLength={200}
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={describedBy('titulo', errores.titulo)}
          autoFocus
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="fecha_limite"
          etiqueta="Día"
          descripcion="Opcional"
          error={errores.fecha_limite}
        >
          <Input
            id="fecha_limite"
            name="fecha_limite"
            type="date"
            className="h-11 text-base md:text-base"
            defaultValue={valores.fecha_limite ?? hoy}
            aria-invalid={errores.fecha_limite ? true : undefined}
            aria-describedby={describedBy('fecha_limite', errores.fecha_limite)}
          />
        </Campo>
        <Campo id="hora" etiqueta="Hora" descripcion="Opcional" error={errores.hora}>
          <Input
            id="hora"
            name="hora"
            type="time"
            className="h-11 text-base md:text-base"
            defaultValue={valores.hora ?? ''}
            aria-invalid={errores.hora ? true : undefined}
            aria-describedby={describedBy('hora', errores.hora)}
          />
        </Campo>
      </div>

      <Campo
        id="cliente_id"
        etiqueta="Cliente"
        descripcion="Opcional"
        error={errores.cliente_id}
      >
        <Select
          name="cliente_id"
          defaultValue={valores.cliente_id ?? ''}
          items={[
            { value: '', label: 'Sin cliente' },
            ...clientes.map((c) => ({ value: c.id, label: c.nombre_negocio })),
          ]}
        >
          <SelectTrigger id="cliente_id" className="w-full data-[size=default]:h-11 text-base md:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin cliente</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nombre_negocio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pendiente}
        className="bg-marca h-12 w-full rounded-full text-base font-semibold text-white"
      >
        {pendiente ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  )
}
