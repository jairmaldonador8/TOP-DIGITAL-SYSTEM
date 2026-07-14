import { describe, expect, it } from 'vitest'

import {
  AREA_POR_ROL,
  destinoPorRol,
  rolDesdeClaims,
  rolPuedeAcceder,
} from '../redirect'

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

  it('devuelve /login cuando falta user_role (sesión sin rol es inválida)', () => {
    expect(destinoPorRol({})).toBe('/login')
  })

  it('devuelve /login cuando user_role es desconocido', () => {
    expect(destinoPorRol({ user_role: 'superusuario' })).toBe('/login')
  })
})

describe('rolDesdeClaims', () => {
  it('devuelve null cuando claims es null o undefined', () => {
    expect(rolDesdeClaims(null)).toBeNull()
    expect(rolDesdeClaims(undefined)).toBeNull()
  })

  it('devuelve el rol cuando es admin o cliente', () => {
    expect(rolDesdeClaims({ user_role: 'admin' })).toBe('admin')
    expect(rolDesdeClaims({ user_role: 'cliente' })).toBe('cliente')
  })

  it('devuelve null cuando user_role falta o es desconocido', () => {
    expect(rolDesdeClaims({})).toBeNull()
    expect(rolDesdeClaims({ user_role: 'otro' })).toBeNull()
    expect(rolDesdeClaims({ user_role: 123 })).toBeNull()
  })
})

describe('rolPuedeAcceder', () => {
  it('admin accede a /agencia pero no a /portal', () => {
    expect(rolPuedeAcceder('admin', '/agencia')).toBe(true)
    expect(rolPuedeAcceder('admin', '/agencia/clientes')).toBe(true)
    expect(rolPuedeAcceder('admin', '/portal')).toBe(false)
    expect(rolPuedeAcceder('admin', '/portal/tareas')).toBe(false)
  })

  it('cliente accede a /portal pero no a /agencia', () => {
    expect(rolPuedeAcceder('cliente', '/portal')).toBe(true)
    expect(rolPuedeAcceder('cliente', '/portal/tareas')).toBe(true)
    expect(rolPuedeAcceder('cliente', '/agencia')).toBe(false)
    expect(rolPuedeAcceder('cliente', '/agencia/clientes')).toBe(false)
  })

  it('rutas fuera de las áreas protegidas son accesibles para ambos roles', () => {
    expect(rolPuedeAcceder('admin', '/')).toBe(true)
    expect(rolPuedeAcceder('cliente', '/')).toBe(true)
  })

  it('no confunde prefijos parciales (ej. /portales)', () => {
    expect(rolPuedeAcceder('admin', '/portales')).toBe(true)
    expect(rolPuedeAcceder('cliente', '/agencias')).toBe(true)
  })
})

describe('AREA_POR_ROL', () => {
  it('mapea admin a /agencia y cliente a /portal', () => {
    expect(AREA_POR_ROL.admin).toBe('/agencia')
    expect(AREA_POR_ROL.cliente).toBe('/portal')
  })
})
