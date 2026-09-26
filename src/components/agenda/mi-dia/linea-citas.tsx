'use client'

import * as React from 'react'
import { CalendarPlusIcon } from 'lucide-react'

import { CitaForm } from '@/components/agenda/cita-form'
import { HojaAgregar, type DatosHojaAgregar } from '@/components/agenda/hoja-agregar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CitaDia } from '@/lib/agenda/tipos'
import { cn } from '@/lib/utils'

/** Color del filo izquierdo por tipo: junta magenta, sesión naranja, resto violeta. */
const BORDE_TIPO: Record<string, string> = {
  junta: 'border-l-marca-magenta',
  sesion: 'border-l-marca-naranja',
}

const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** "30 min", "1 h", "1 h 30 min" entre inicio y fin (null si falta alguno). */
function duracion(hora: string | null, horaFin: string | null): string | null {
  if (!hora || !horaFin) return null
  const total = minutos(horaFin) - minutos(hora)
  if (total <= 0) return null
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Línea de tiempo de las citas de hoy; tocar una la abre para editar. */
export function LineaCitas({ citas, datos }: { citas: CitaDia[]; datos: DatosHojaAgregar }) {
  const [cita, setCita] = React.useState<CitaDia | null>(null)
  const [abierta, setAbierta] = React.useState(false)
  const [apertura, setApertura] = React.useState(0)
  const [agendando, setAgendando] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierta(false), [])

  const abrir = (c: CitaDia) => {
    setCita(c)
    setApertura((n) => n + 1)
    setAbierta(true)
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3">
        <p className="text-sm text-muted-foreground">Sin citas hoy</p>
        <button
          type="button"
          onClick={() => setAgendando(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
        >
          <CalendarPlusIcon aria-hidden className="size-4 text-marca-magenta" />
          Agendar
        </button>
        <HojaAgregar abierta={agendando} alCambiar={setAgendando} datos={datos} inicial="cita" />
      </div>
    )
  }

  return (
    <>
      <ol className="flex flex-col gap-2">
        {citas.map((c) => {
          const detalle = [c.cliente, c.lugar, duracion(c.hora, c.horaFin)].filter(Boolean).join(' · ')
          return (
            <li key={c.id} className="flex min-h-14 items-stretch gap-3">
              <span className="w-14 shrink-0 pt-3 text-xs leading-tight text-muted-foreground tabular-nums">
                {c.hora ?? (
                  <>
                    Todo
                    <br />
                    el día
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => abrir(c)}
                className={cn(
                  'flex min-h-14 flex-1 flex-col justify-center rounded-2xl border border-border/60 border-l-[3px] bg-card px-4 py-2.5 text-left transition-colors hover:bg-muted/60 active:scale-[0.99]',
                  BORDE_TIPO[c.tipo] ?? 'border-l-marca-violeta'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium leading-snug">{c.titulo}</span>
                  {c.origen === 'google' ? (
                    <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Google
                    </span>
                  ) : null}
                </span>
                {detalle ? <span className="mt-0.5 text-xs text-muted-foreground">{detalle}</span> : null}
              </button>
            </li>
          )
        })}
      </ol>

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
            <CitaForm key={`${cita.id}-${apertura}`} clientes={datos.clientes} cita={cita} hoy={datos.hoy} alExito={cerrar} />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
