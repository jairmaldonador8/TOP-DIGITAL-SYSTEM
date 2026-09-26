'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'

import { CitaForm, type CitaEditable, type ClienteOpcionCita } from '@/components/agenda/cita-form'
import { sumarDias } from '@/components/calendario/franja-semana'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ElementoCalendario, TipoElemento } from '@/lib/calendario/tipos'
import { formatoFechaLarga } from '@/lib/formato'
import { cn } from '@/lib/utils'

export const COLOR: Record<TipoElemento, string> = {
  campania: 'bg-marca-violeta',
  encargo: 'bg-marca-magenta',
  tarea: 'bg-marca-naranja',
  evento: 'bg-sky-500',
}

export const ETIQUETA: Record<TipoElemento, string> = {
  campania: 'Campaña',
  encargo: 'Entrega',
  tarea: 'Tarea',
  evento: 'Cita',
}

/** Cantidad de días que lista la agenda: el seleccionado y los 6 siguientes. */
const DIAS_AGENDA = 7

/** ElementoCalendario (tipo 'evento') → datos del formulario de edición. */
function aCitaEditable(e: ElementoCalendario): CitaEditable {
  return {
    id: e.id,
    titulo: e.titulo,
    fecha: e.fecha,
    hora: e.hora,
    horaFin: e.horaFin,
    lugar: e.lugar,
    avisoMin: e.avisoMin,
    clienteId: e.clienteId,
    // Nombre del cliente: CitaForm lo usa si el cliente ya no está activo.
    cliente: e.clienteId ? e.cliente : null,
    descripcion: e.descripcion,
    tipo: e.subtipo ?? 'otro',
    origen: e.origen ?? 'sistema',
  }
}

/**
 * Agenda de 7 días a partir del día seleccionado, con encabezado por día.
 * Las citas se editan en una hoja inferior; lo demás lleva a su módulo.
 */
export function AgendaDias({
  desde,
  hoy,
  porDia,
  clientes,
}: {
  desde: string
  hoy: string
  porDia: Map<string, ElementoCalendario[]>
  clientes: ClienteOpcionCita[]
}) {
  const [cita, setCita] = React.useState<CitaEditable | null>(null)
  const [abierta, setAbierta] = React.useState(false)
  const [apertura, setApertura] = React.useState(0)
  const cerrar = React.useCallback(() => setAbierta(false), [])

  const abrir = (e: ElementoCalendario) => {
    setCita(aCitaEditable(e))
    setApertura((n) => n + 1)
    setAbierta(true)
  }

  const fechas = Array.from({ length: DIAS_AGENDA }, (_, i) => sumarDias(desde, i))

  return (
    <>
      <div className="flex flex-col gap-5">
        {fechas.map((fecha) => {
          const suyos = porDia.get(fecha) ?? []
          return (
            <section key={fecha} aria-label={formatoFechaLarga(new Date(`${fecha}T12:00:00Z`))}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                {formatoFechaLarga(new Date(`${fecha}T12:00:00Z`))}
                {fecha === hoy ? (
                  <span className="bg-marca rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
                    Hoy
                  </span>
                ) : null}
              </h3>
              {suyos.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  Día libre
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {suyos.map((elemento) => (
                    <li key={elemento.uid}>
                      <FilaAgenda elemento={elemento} alAbrir={abrir} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <Sheet open={abierta} onOpenChange={setAbierta}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-0 bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-0">
            <SheetTitle>Editar cita</SheetTitle>
            <SheetDescription className="sr-only">Cambia los datos de la cita o elimínala</SheetDescription>
          </SheetHeader>
          {cita ? (
            <CitaForm key={`${cita.id}-${apertura}`} clientes={clientes} cita={cita} alExito={cerrar} />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function FilaAgenda({
  elemento,
  alAbrir,
}: {
  elemento: ElementoCalendario
  alAbrir: (e: ElementoCalendario) => void
}) {
  const clase =
    'flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.99]'

  const contenido = (
    <>
      <span className="w-12 shrink-0 text-xs leading-tight text-muted-foreground tabular-nums">
        {elemento.hora ?? 'Todo el día'}
      </span>
      <span
        aria-label={ETIQUETA[elemento.tipo]}
        title={ETIQUETA[elemento.tipo]}
        role="img"
        className={cn('size-2.5 shrink-0 rounded-full', COLOR[elemento.tipo])}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{elemento.titulo}</span>
        {elemento.detalle ? (
          <span className="block truncate text-xs text-muted-foreground">{elemento.detalle}</span>
        ) : null}
      </span>
      {elemento.origen === 'google' ? (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Google
        </span>
      ) : null}
      {elemento.tipo !== 'evento' ? (
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  )

  if (elemento.tipo === 'evento') {
    return (
      <button type="button" onClick={() => alAbrir(elemento)} className={clase}>
        {contenido}
      </button>
    )
  }
  return (
    <Link href={elemento.href} className={clase}>
      {contenido}
    </Link>
  )
}
