import { describe, expect, it } from 'vitest'

import { ESTADOS_ENCARGO, puedeTransicionar } from '../transiciones'

describe('puedeTransicionar', () => {
  it('equipo: pendiente→en_progreso, cambios→en_progreso, en_progreso→entregado', () => {
    expect(puedeTransicionar('equipo', 'pendiente', 'en_progreso')).toBe(true)
    expect(puedeTransicionar('equipo', 'cambios', 'en_progreso')).toBe(true)
    expect(puedeTransicionar('equipo', 'en_progreso', 'entregado')).toBe(true)
  })

  it('admin: entregado→aprobado y entregado→cambios', () => {
    expect(puedeTransicionar('admin', 'entregado', 'aprobado')).toBe(true)
    expect(puedeTransicionar('admin', 'entregado', 'cambios')).toBe(true)
  })

  it('equipo NUNCA aprueba ni pide cambios', () => {
    for (const de of ESTADOS_ENCARGO) {
      expect(puedeTransicionar('equipo', de, 'aprobado')).toBe(false)
      expect(puedeTransicionar('equipo', de, 'cambios')).toBe(false)
    }
  })

  it('aprobado es terminal para todos los roles', () => {
    for (const a of ESTADOS_ENCARGO) {
      expect(puedeTransicionar('equipo', 'aprobado', a)).toBe(false)
      expect(puedeTransicionar('admin', 'aprobado', a)).toBe(false)
    }
  })

  it('matriz completa: solo las 5 transiciones válidas existen', () => {
    const validas = new Set([
      'equipo:pendiente:en_progreso',
      'equipo:cambios:en_progreso',
      'equipo:en_progreso:entregado',
      'admin:entregado:aprobado',
      'admin:entregado:cambios',
    ])
    for (const rol of ['equipo', 'admin'] as const) {
      for (const de of ESTADOS_ENCARGO) {
        for (const a of ESTADOS_ENCARGO) {
          expect(puedeTransicionar(rol, de, a)).toBe(
            validas.has(`${rol}:${de}:${a}`)
          )
        }
      }
    }
  })
})
