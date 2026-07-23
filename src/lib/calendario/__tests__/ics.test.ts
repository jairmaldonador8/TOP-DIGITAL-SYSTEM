import { describe, expect, it } from 'vitest'

import type { ElementoCalendario } from '../tipos'
import { escaparICS, generarICS, plegarLinea } from '../ics'

const elemento = (extra: Partial<ElementoCalendario>): ElementoCalendario => ({
  id: 'x',
  uid: 'evento:x',
  fecha: '2026-07-24',
  hora: null,
  titulo: 'Título',
  detalle: null,
  tipo: 'evento',
  subtipo: null,
  href: '/agencia/calendario',
  ...extra,
})

describe('escaparICS', () => {
  it('escapa comas, punto y coma, backslash y saltos de línea', () => {
    expect(escaparICS('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })
})

describe('plegarLinea', () => {
  it('deja intactas las líneas cortas', () => {
    expect(plegarLinea('SUMMARY:Hola')).toBe('SUMMARY:Hola')
  })

  it('pliega a 75 octetos con continuación de espacio', () => {
    const larga = 'SUMMARY:' + 'a'.repeat(100)
    const plegada = plegarLinea(larga)
    const lineas = plegada.split('\r\n')
    expect(lineas.length).toBeGreaterThan(1)
    expect(lineas[1].startsWith(' ')).toBe(true)
    for (const linea of lineas) {
      expect(Buffer.byteLength(linea, 'utf8')).toBeLessThanOrEqual(75)
    }
    expect(plegada.replace(/\r\n /g, '')).toBe(larga)
  })

  it('nunca parte un carácter multibyte (emoji en el título)', () => {
    // 8 octetos por par de emoji: fuerza el corte cerca de un límite impar.
    const larga = 'SUMMARY:📣🎬' + 'á'.repeat(60)
    const plegada = plegarLinea(larga)
    for (const linea of plegada.split('\r\n')) {
      expect(Buffer.byteLength(linea, 'utf8')).toBeLessThanOrEqual(75)
      // Si un multibyte se partiera, el roundtrip UTF-8 lo corrompería.
      expect(Buffer.from(linea, 'utf8').toString('utf8')).toBe(linea)
    }
    expect(plegada.replace(/\r\n /g, '')).toBe(larga)
  })
})

describe('generarICS', () => {
  it('calendario vacío es un VCALENDAR válido con nombre', () => {
    const ics = generarICS([])
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('X-WR-CALNAME:Top Digital')
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('día completo usa VALUE=DATE y el UID es estable con dominio', () => {
    const ics = generarICS([elemento({ uid: 'campania:abc', tipo: 'campania' })])
    expect(ics).toContain('DTSTART;VALUE=DATE:20260724')
    expect(ics).toContain('UID:campania:abc@topdigital.company')
    expect(ics).toContain('SUMMARY:📣 Título')
  })

  it('con hora usa hora local flotante y duración de 1h', () => {
    const ics = generarICS([elemento({ hora: '14:30' })])
    expect(ics).toContain('DTSTART:20260724T143000')
    expect(ics).not.toContain('20260724T143000Z')
    expect(ics).toContain('DURATION:PT1H')
  })

  it('el detalle va en DESCRIPTION escapado', () => {
    const ics = generarICS([
      elemento({ detalle: 'Cliente: Tacos, El Patrón; urgente' }),
    ])
    expect(ics).toContain('DESCRIPTION:Cliente: Tacos\\, El Patrón\\; urgente')
  })
})
