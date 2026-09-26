'use client'

import * as React from 'react'
import { PlusIcon } from 'lucide-react'

import { HojaAgregar, type DatosHojaAgregar, type PestanaAgregar } from '@/components/agenda/hoja-agregar'

/**
 * Botón "+" de escritorio que abre la hoja de agregar. En móvil lo cubre
 * la barra inferior, así que solo aparece en pantallas grandes.
 */
export function BotonAgregar({
  datos, inicial = 'cita', etiqueta = 'Agregar',
}: {
  datos: DatosHojaAgregar
  inicial?: PestanaAgregar
  etiqueta?: string
}) {
  const [abierta, setAbierta] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="bg-marca hidden h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-md shadow-marca-magenta/20 transition-transform hover:scale-[1.02] active:scale-[0.98] lg:inline-flex"
      >
        <PlusIcon aria-hidden className="size-4" />
        {etiqueta}
      </button>
      <HojaAgregar abierta={abierta} alCambiar={setAbierta} datos={datos} inicial={inicial} />
    </>
  )
}
