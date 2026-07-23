import { describe, expect, it } from 'vitest'

import { promedioCPL, saludCampania } from '../salud'

describe('saludCampania (reglas en orden: gris → rojo → verde → ambar)', () => {
  const base = { estado: 'activa' as const, promedioCliente: 100 }

  it('no activa → gris (pausada y archivada, aunque tengan actividad)', () => {
    expect(
      saludCampania({
        estado: 'pausada',
        gasto7d: 500,
        conversaciones7d: 10,
        promedioCliente: 100,
      })
    ).toBe('gris')
    expect(
      saludCampania({
        estado: 'archivada',
        gasto7d: 500,
        conversaciones7d: 10,
        promedioCliente: 100,
      })
    ).toBe('gris')
  })

  it('activa sin gasto → gris, incluso con conversaciones (atribución tardía)', () => {
    expect(
      saludCampania({ ...base, gasto7d: 0, conversaciones7d: 0 })
    ).toBe('gris')
    expect(
      saludCampania({ ...base, gasto7d: 0, conversaciones7d: 5 })
    ).toBe('gris')
  })

  it('gasto sin conversaciones → rojo', () => {
    expect(
      saludCampania({ ...base, gasto7d: 350, conversaciones7d: 0 })
    ).toBe('rojo')
  })

  it('gasto sin conversaciones → rojo aunque el promedio sea null', () => {
    expect(
      saludCampania({
        estado: 'activa',
        gasto7d: 350,
        conversaciones7d: 0,
        promedioCliente: null,
      })
    ).toBe('rojo')
  })

  it('promedio null con conversaciones → verde (nunca rojo por costo)', () => {
    expect(
      saludCampania({
        estado: 'activa',
        gasto7d: 900,
        conversaciones7d: 1,
        promedioCliente: null,
      })
    ).toBe('verde')
  })

  it('cpl igual o mejor que el promedio → verde (borde inclusivo en 1×)', () => {
    // cpl = 500/5 = 100 = promedio
    expect(
      saludCampania({ ...base, gasto7d: 500, conversaciones7d: 5 })
    ).toBe('verde')
    // cpl = 80 < promedio
    expect(
      saludCampania({ ...base, gasto7d: 400, conversaciones7d: 5 })
    ).toBe('verde')
  })

  it('entre 1× y 2× el promedio → ambar (borde inclusivo en 2×)', () => {
    // cpl = 150
    expect(
      saludCampania({ ...base, gasto7d: 750, conversaciones7d: 5 })
    ).toBe('ambar')
    // cpl = 200 = 2×promedio exacto
    expect(
      saludCampania({ ...base, gasto7d: 1000, conversaciones7d: 5 })
    ).toBe('ambar')
  })

  it('cpl por encima de 2× el promedio → rojo', () => {
    // cpl = 201
    expect(
      saludCampania({ ...base, gasto7d: 1005, conversaciones7d: 5 })
    ).toBe('rojo')
  })
})

describe('promedioCPL', () => {
  it('suma gasto y conversaciones de vida del cliente', () => {
    expect(
      promedioCPL([
        { gasto: 1000, conversaciones: 10 },
        { gasto: 500, conversaciones: 5 },
      ])
    ).toBe(100)
  })

  it('null cuando el cliente no tiene conversaciones históricas', () => {
    expect(promedioCPL([{ gasto: 800, conversaciones: 0 }])).toBeNull()
    expect(promedioCPL([])).toBeNull()
  })
})
