import { describe, expect, it } from 'vitest'

import { fechaInterna, restarDiasHabiles, siguientesCiclos, sumarDiasHabiles } from '../fechas'

describe('días hábiles', () => {
  it('resta saltando fines de semana', () => {
    expect(restarDiasHabiles('2026-12-01', 2)).toBe('2026-11-27') // mar → vie
    expect(restarDiasHabiles('2026-11-16', 2)).toBe('2026-11-12') // lun → jue
  })
  it('suma saltando fines de semana', () => {
    expect(sumarDiasHabiles('2026-11-13', 2)).toBe('2026-11-17') // vie → mar
  })
  it('fecha interna = 2 días hábiles antes', () => {
    expect(fechaInterna('2026-11-15')).toBe('2026-11-12') // dom → jue
  })
})

describe('siguientesCiclos', () => {
  it('devuelve los próximos días 1 y 15 desde hoy (incluido)', () => {
    expect(siguientesCiclos('2026-11-09', 3)).toEqual(['2026-11-15', '2026-12-01', '2026-12-15'])
    expect(siguientesCiclos('2026-11-15', 2)).toEqual(['2026-11-15', '2026-12-01'])
    expect(siguientesCiclos('2026-12-20', 2)).toEqual(['2027-01-01', '2027-01-15'])
  })
})
