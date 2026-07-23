import { describe, expect, it } from 'vitest'

import {
  deltasSemana,
  gastoDelMes,
  proyeccionMes,
  serieDiaria,
} from '../metricas'

const HOY = '2026-07-23'

const fila = (fecha: string, gasto: number, conversaciones: number) => ({
  fecha,
  gasto,
  conversaciones,
})

describe('serieDiaria', () => {
  it('produce N puntos consecutivos terminando en hoy, con huecos en 0', () => {
    const filas = [fila('2026-07-21', 100, 5), fila('2026-07-23', 50, 2)]

    const serie = serieDiaria(filas, 4, HOY)

    expect(serie).toEqual([
      { fecha: '2026-07-20', gasto: 0, conversaciones: 0 },
      { fecha: '2026-07-21', gasto: 100, conversaciones: 5 },
      { fecha: '2026-07-22', gasto: 0, conversaciones: 0 },
      { fecha: '2026-07-23', gasto: 50, conversaciones: 2 },
    ])
  })

  it('cruza el limite de mes sin brincarse dias', () => {
    const serie = serieDiaria([], 3, '2026-08-01')
    expect(serie.map((p) => p.fecha)).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ])
  })
})

describe('deltasSemana', () => {
  it('compara los ultimos 7 dias contra los 7 anteriores', () => {
    const filas = [
      // Fuera de ambas ventanas: no debe contar.
      fila('2026-07-09', 9999, 99),
      // Semana anterior (07-10 .. 07-16), bordes incluidos: 10 conv, $500
      fila('2026-07-10', 200, 4),
      fila('2026-07-16', 300, 6),
      // Semana actual (07-17 .. 07-23), bordes incluidos: 20 conv, $600
      fila('2026-07-17', 300, 12),
      fila('2026-07-23', 300, 8),
    ]

    const d = deltasSemana(filas, HOY)

    expect(d.conversaciones).toEqual({ valor: 20, deltaPct: 100 })
    expect(d.gasto).toEqual({ valor: 600, deltaPct: 20 })
    // cpl actual 30, anterior 50 → -40%
    expect(d.cpl).toEqual({ valor: 30, deltaPct: -40 })
  })

  it('delta null cuando la semana anterior fue 0; cpl null sin conversaciones', () => {
    const filas = [fila('2026-07-20', 300, 0)]

    const d = deltasSemana(filas, HOY)

    expect(d.conversaciones).toEqual({ valor: 0, deltaPct: null })
    expect(d.gasto).toEqual({ valor: 300, deltaPct: null })
    expect(d.cpl).toEqual({ valor: null, deltaPct: null })
  })
})

describe('gastoDelMes', () => {
  it('suma solo el mes calendario en curso', () => {
    const filas = [
      fila('2026-06-30', 999, 1),
      fila('2026-07-01', 100, 1),
      fila('2026-07-23', 200, 1),
    ]
    expect(gastoDelMes(filas, HOY)).toBe(300)
  })
})

describe('proyeccionMes', () => {
  it('proyecta al cierre segun el ritmo del dia actual', () => {
    // 23 de julio (31 dias): 2300 / 23 × 31 = 3100
    expect(proyeccionMes(2300, HOY)).toBe(3100)
  })

  it('null sin gasto', () => {
    expect(proyeccionMes(0, HOY)).toBeNull()
  })

  it('usa los dias reales del mes (feb 29 en bisiesto)', () => {
    // 10 de feb 2028 (29 dias): 290 / 10 × 29 = 841
    expect(proyeccionMes(290, '2028-02-10')).toBe(841)
  })
})
