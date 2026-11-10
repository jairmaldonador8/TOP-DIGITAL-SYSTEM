import { describe, expect, it } from 'vitest'

import { semaforo } from '../semaforo'

const HOY = '2026-11-10' // martes

describe('semaforo', () => {
  it('gris si espera a otro', () => {
    expect(semaforo({ estado: 'esperando', fechaLimite: '2026-11-01', hoy: HOY })).toBe('gris')
  })
  it('verde si ya se entregó o aprobó aunque la fecha pasara', () => {
    expect(semaforo({ estado: 'entregado', fechaLimite: '2026-11-01', hoy: HOY })).toBe('verde')
    expect(semaforo({ estado: 'aprobado', fechaLimite: '2026-11-01', hoy: HOY })).toBe('verde')
  })
  it('rojo si la fecha interna ya pasó', () => {
    expect(semaforo({ estado: 'en_progreso', fechaLimite: '2026-11-09', hoy: HOY })).toBe('rojo')
  })
  it('amarillo si vence hoy o el siguiente día hábil', () => {
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-10', hoy: HOY })).toBe('amarillo')
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-11', hoy: HOY })).toBe('amarillo')
  })
  it('verde con margen o sin fecha', () => {
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-13', hoy: HOY })).toBe('verde')
    expect(semaforo({ estado: 'pendiente', fechaLimite: null, hoy: HOY })).toBe('verde')
  })
  it('cambios cuenta como trabajo abierto', () => {
    expect(semaforo({ estado: 'cambios', fechaLimite: '2026-11-09', hoy: HOY })).toBe('rojo')
  })
})
