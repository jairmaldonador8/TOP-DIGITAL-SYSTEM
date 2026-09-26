'use client'

/**
 * Hoja del botón +: agendar una cita, anotar un pendiente o asignar un
 * encargo. Controlada desde afuera (la abren la barra inferior y los
 * botones de Mi día/Calendario). Hoja inferior en móvil, centrada y
 * angosta en pantallas grandes.
 */
import * as React from 'react'

import { CitaForm, type ClienteOpcionCita } from '@/components/agenda/cita-form'
import { PendienteForm } from '@/components/agenda/pendiente-form'
import { FormularioEncargo, type TrabajadorOpcion } from '@/components/equipo/formularios-equipo'
import { crearEncargo } from '@/app/(app)/agencia/equipo/actions'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type PestanaAgregar = 'cita' | 'pendiente' | 'encargo'

export type DatosHojaAgregar = {
  clientes: ClienteOpcionCita[]
  trabajadores: TrabajadorOpcion[]
  hoy: string
}

export function HojaAgregar({
  abierta, alCambiar, datos, inicial = 'cita',
}: {
  abierta: boolean
  alCambiar: (abierta: boolean) => void
  datos: DatosHojaAgregar
  inicial?: PestanaAgregar
}) {
  const [pestana, setPestana] = React.useState<PestanaAgregar>(inicial)
  const [epoca, setEpoca] = React.useState(0)
  const cerrar = React.useCallback(() => alCambiar(false), [alCambiar])

  // La abren desde afuera con alCambiar(true) (onOpenChange no se dispara):
  // al abrirse, formularios limpios y la pestaña inicial. Patrón "ajustar
  // estado cuando cambia una prop" (sin efecto).
  const [abiertaPrevia, setAbiertaPrevia] = React.useState(abierta)
  if (abierta !== abiertaPrevia) {
    setAbiertaPrevia(abierta)
    if (abierta) { setEpoca((n) => n + 1); setPestana(inicial) }
  }

  const PESTANAS: { id: PestanaAgregar; label: string }[] = [
    { id: 'cita', label: 'Cita' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'encargo', label: 'Encargo' },
  ]

  return (
    <Sheet open={abierta} onOpenChange={alCambiar}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-0 bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0">
          <SheetTitle>Agregar</SheetTitle>
          <SheetDescription className="sr-only">Agenda una cita, anota un pendiente o asigna un encargo</SheetDescription>
        </SheetHeader>
        <div role="tablist" className="mb-4 flex gap-2">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              type="button"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={cn(
                'h-10 rounded-full px-4 text-sm font-semibold transition-colors',
                pestana === p.id ? 'bg-marca text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {pestana === 'cita' && <CitaForm key={`c${epoca}`} clientes={datos.clientes} alExito={cerrar} />}
        {pestana === 'pendiente' && <PendienteForm key={`p${epoca}`} clientes={datos.clientes} hoy={datos.hoy} alExito={cerrar} />}
        {pestana === 'encargo' && (
          <FormularioEncargo
            key={`e${epoca}`}
            action={crearEncargo}
            etiquetas={{ enviando: 'Asignando…', enviar: 'Asignar encargo' }}
            trabajadores={datos.trabajadores}
            clientes={datos.clientes}
            alExito={cerrar}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
