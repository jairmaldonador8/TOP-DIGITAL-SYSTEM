'use client'

import * as React from 'react'

import type { PuntoSerie } from '@/lib/campanias/metricas'
import { formatoFechaCorta, formatoMoneda } from '@/lib/formato'

/**
 * Tendencia de 30 días del cliente: área de conversaciones (magenta) y,
 * debajo compartiendo eje X, columnas de gasto (naranja). Dos gráficas de
 * una serie cada una — nunca doble eje. Paleta validada en superficie
 * oscura (dataviz: #f0338d / #ea580c). Tocar un día lo resalta y muestra
 * su detalle en el caption fijo (sin overlays).
 */

const ANCHO = 640
const ALTO_CONV = 140
const ALTO_GASTO = 56
const MARGEN = { arriba: 10, abajo: 4, izq: 8, der: 8 }
const COLOR_CONV = '#f0338d'
const COLOR_GASTO = '#ea580c'

export function GraficaTendencia({ serie }: { serie: PuntoSerie[] }) {
  const [activo, setActivo] = React.useState<number | null>(null)

  const maxConv = Math.max(...serie.map((p) => p.conversaciones), 1)
  const maxGasto = Math.max(...serie.map((p) => p.gasto), 1)
  const sinDatos = serie.every((p) => p.conversaciones === 0 && p.gasto === 0)

  if (sinDatos) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Los datos diarios se llenan con la próxima sincronización.
      </p>
    )
  }

  const anchoUtil = ANCHO - MARGEN.izq - MARGEN.der
  const paso = anchoUtil / (serie.length - 1)
  const x = (i: number) => MARGEN.izq + i * paso

  const altoConvUtil = ALTO_CONV - MARGEN.arriba - MARGEN.abajo
  const yConv = (v: number) =>
    MARGEN.arriba + altoConvUtil * (1 - v / maxConv)

  const linea = serie
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yConv(p.conversaciones).toFixed(1)}`)
    .join(' ')
  const area = `${linea} L${x(serie.length - 1).toFixed(1)},${ALTO_CONV - MARGEN.abajo} L${MARGEN.izq},${ALTO_CONV - MARGEN.abajo} Z`

  // Columnas de gasto: ≤24px de grosor con aire entre columnas.
  const anchoCol = Math.min(24, paso * 0.6)
  const yGasto = (v: number) => (ALTO_GASTO - 6) * (1 - v / maxGasto) + 2

  const punto = activo !== null ? serie[activo] : serie[serie.length - 1]
  const promedio = Math.round(
    serie.reduce((s, p) => s + p.conversaciones, 0) / serie.length
  )
  const maxIdx = serie.reduce(
    (mejor, p, i) => (p.conversaciones > serie[mejor].conversaciones ? i : mejor),
    0
  )

  const elegir = (evento: React.PointerEvent<SVGSVGElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect()
    const relX = ((evento.clientX - caja.left) / caja.width) * ANCHO
    const indice = Math.round((relX - MARGEN.izq) / paso)
    setActivo(Math.max(0, Math.min(serie.length - 1, indice)))
  }

  return (
    <figure
      role="img"
      aria-label={`Conversaciones por día en 30 días, promedio ${promedio} al día`}
      className="flex flex-col gap-1"
    >
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO_CONV}`}
        className="w-full touch-none"
        onPointerDown={elegir}
        onPointerMove={(e) => e.buttons > 0 && elegir(e)}
      >
        <defs>
          <linearGradient id="area-conv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR_CONV} stopOpacity="0.25" />
            <stop offset="100%" stopColor={COLOR_CONV} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Rejilla recesiva: solo la línea base */}
        <line
          x1={MARGEN.izq}
          x2={ANCHO - MARGEN.der}
          y1={ALTO_CONV - MARGEN.abajo}
          y2={ALTO_CONV - MARGEN.abajo}
          className="stroke-border"
          strokeWidth="1"
        />
        <path d={area} fill="url(#area-conv)" />
        <path
          d={linea}
          fill="none"
          stroke={COLOR_CONV}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Etiqueta selectiva: solo el pico */}
        {serie[maxIdx].conversaciones > 0 && activo === null ? (
          <text
            x={x(maxIdx)}
            y={yConv(serie[maxIdx].conversaciones) - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px] font-medium"
          >
            {serie[maxIdx].conversaciones}
          </text>
        ) : null}
        {/* Punto activo (o el último): ≥8px con anillo de superficie */}
        {(() => {
          const i = activo ?? serie.length - 1
          return (
            <circle
              cx={x(i)}
              cy={yConv(serie[i].conversaciones)}
              r="5"
              fill={COLOR_CONV}
              className="stroke-card"
              strokeWidth="2"
            />
          )
        })()}
      </svg>

      <svg viewBox={`0 0 ${ANCHO} ${ALTO_GASTO}`} className="w-full" aria-hidden>
        {serie.map((p, i) =>
          p.gasto > 0 ? (
            <rect
              key={p.fecha}
              x={x(i) - anchoCol / 2}
              y={yGasto(p.gasto)}
              width={anchoCol}
              height={ALTO_GASTO - 6 - yGasto(p.gasto) + 2}
              rx="2"
              fill={COLOR_GASTO}
              opacity={activo === null || activo === i ? 0.9 : 0.35}
            />
          ) : null
        )}
      </svg>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: COLOR_CONV }}
            />
            Conversaciones
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-[3px]"
              style={{ background: COLOR_GASTO }}
            />
            Gasto
          </span>
        </span>
        <span className="font-medium text-foreground">
          {formatoFechaCorta(punto.fecha)}: {punto.conversaciones} conv. ·{' '}
          {formatoMoneda(punto.gasto)}
        </span>
      </figcaption>
    </figure>
  )
}
