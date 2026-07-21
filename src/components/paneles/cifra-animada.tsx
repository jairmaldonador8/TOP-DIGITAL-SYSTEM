'use client'

import * as React from 'react'

import { formatoMoneda } from '@/lib/formato'

const entero = new Intl.NumberFormat('es-MX')

/**
 * Cifra que cuenta de 0 a su valor al montar (easing suave). Respeta
 * prefers-reduced-motion mostrando el valor final de inmediato.
 */
export function CifraAnimada({
  valor,
  formato = 'entero',
  sufijo = '',
  duracionMs = 900,
}: {
  valor: number
  formato?: 'entero' | 'moneda'
  sufijo?: string
  duracionMs?: number
}) {
  const [actual, setActual] = React.useState(0)

  React.useEffect(() => {
    // Con prefers-reduced-motion la duración es 0: un solo frame al final.
    const duracion = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : duracionMs
    let inicio: number | null = null
    let raf = 0
    const tick = (t: number) => {
      if (inicio === null) inicio = t
      const progreso =
        duracion === 0 ? 1 : Math.min(1, (t - inicio) / duracion)
      const suavizado = 1 - Math.pow(1 - progreso, 3)
      setActual(Math.round(valor * suavizado))
      if (progreso < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valor, duracionMs])

  const texto =
    formato === 'moneda' ? formatoMoneda(actual) : entero.format(actual)
  return (
    <span>
      {texto}
      {sufijo}
    </span>
  )
}
