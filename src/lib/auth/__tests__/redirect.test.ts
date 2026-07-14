import { describe, expect, it } from 'vitest'

import { destinoPorRol } from '../redirect'

describe('destinoPorRol', () => {
  it('devuelve /login cuando claims es null', () => {
    expect(destinoPorRol(null)).toBe('/login')
  })

  it('devuelve /login cuando claims es undefined', () => {
    expect(destinoPorRol(undefined)).toBe('/login')
  })

  it('devuelve /agencia cuando user_role es admin', () => {
    expect(destinoPorRol({ user_role: 'admin' })).toBe('/agencia')
  })

  it('devuelve /portal cuando user_role es cliente', () => {
    expect(destinoPorRol({ user_role: 'cliente' })).toBe('/portal')
  })

  it('devuelve /portal cuando falta user_role', () => {
    expect(destinoPorRol({})).toBe('/portal')
  })
})
