'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { formatoFechaCorta } from '@/lib/formato'
import { cn } from '@/lib/utils'

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Suma días a un 'YYYY-MM-DD' anclado a mediodía UTC (sin saltos de zona). */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Lunes de la semana de `fecha`. */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  return sumarDias(fecha, -((d.getUTCDay() + 6) % 7))
}

/**
 * Franja lunes-domingo de la semana del día seleccionado. Las flechas
 * mueven una semana; la vista decide si basta con cambiar el estado o
 * hay que navegar a otro mes.
 */
export function FranjaSemana({
  seleccionado,
  hoy,
  conElementos,
  alElegir,
  alMoverSemana,
}: {
  seleccionado: string
  hoy: string
  conElementos: (fecha: string) => boolean
  alElegir: (fecha: string) => void
  alMoverSemana: (semanas: 1 | -1) => void
}) {
  const lunes = lunesDe(seleccionado)
  const semana = INICIALES.map((inicial, i) => ({ inicial, fecha: sumarDias(lunes, i) }))

  const flecha =
    'flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted'

  return (
    <div className="flex flex-col gap-1">
      {/* Flechas en su propia fila: a 390 px los 7 días de 44 px no caben junto a ellas. */}
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Semana anterior" onClick={() => alMoverSemana(-1)} className={flecha}>
          <ChevronLeftIcon aria-hidden className="size-5" />
        </button>
        <p className="text-sm font-semibold text-muted-foreground">
          {formatoFechaCorta(lunes)} – {formatoFechaCorta(sumarDias(lunes, 6))}
        </p>
        <button type="button" aria-label="Semana siguiente" onClick={() => alMoverSemana(1)} className={flecha}>
          <ChevronRightIcon aria-hidden className="size-5" />
        </button>
      </div>
      <ol className="grid grid-cols-7 gap-0.5">
        {semana.map(({ inicial, fecha }) => {
          const activo = fecha === seleccionado
          const esHoy = fecha === hoy
          return (
            <li key={fecha} className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">{inicial}</span>
              <button
                type="button"
                onClick={() => alElegir(fecha)}
                aria-pressed={activo}
                aria-label={formatoFechaCorta(fecha)}
                className={cn(
                  'relative flex size-11 items-center justify-center rounded-2xl text-sm font-semibold tabular-nums transition-colors',
                  activo
                    ? 'bg-marca text-white shadow-md shadow-marca-magenta/20'
                    : 'hover:bg-muted',
                  !activo && esHoy && 'text-marca-violeta ring-2 ring-marca-violeta/60'
                )}
              >
                {Number(fecha.slice(8))}
                {conElementos(fecha) ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute bottom-1.5 size-1 rounded-full',
                      activo ? 'bg-white' : 'bg-marca-magenta'
                    )}
                  />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
