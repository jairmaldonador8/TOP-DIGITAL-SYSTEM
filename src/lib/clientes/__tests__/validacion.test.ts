import { describe, expect, it } from 'vitest'

import { validarCliente, validarUsuarioCliente } from '../validacion'

describe('validarCliente', () => {
  it('acepta un cliente con solo nombre_negocio (los demás campos opcionales)', () => {
    const resultado = validarCliente({ nombre_negocio: 'Tacos El Patrón' })
    expect(resultado).toEqual({
      ok: true,
      datos: {
        nombre_negocio: 'Tacos El Patrón',
        contacto_nombre: null,
        email: null,
        telefono: null,
        presupuesto_ads: 0,
        meta_facturacion: 0,
        notas: null,
      },
    })
  })

  it('recorta espacios en nombre_negocio y campos de texto', () => {
    const resultado = validarCliente({
      nombre_negocio: '  Café Central  ',
      contacto_nombre: '  Ana López ',
      telefono: ' 555 123 4567 ',
      notas: '  cliente nuevo  ',
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.nombre_negocio).toBe('Café Central')
    expect(resultado.datos.contacto_nombre).toBe('Ana López')
    expect(resultado.datos.telefono).toBe('555 123 4567')
    expect(resultado.datos.notas).toBe('cliente nuevo')
  })

  it('rechaza nombre_negocio ausente', () => {
    const resultado = validarCliente({})
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.nombre_negocio).toBeTruthy()
  })

  it('rechaza nombre_negocio vacío o de solo espacios', () => {
    for (const valor of ['', '   ']) {
      const resultado = validarCliente({ nombre_negocio: valor })
      expect(resultado.ok).toBe(false)
      if (resultado.ok) return
      expect(resultado.errores.nombre_negocio).toBeTruthy()
    }
  })

  it('acepta email válido y lo recorta', () => {
    const resultado = validarCliente({
      nombre_negocio: 'X',
      email: ' contacto@negocio.mx ',
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.email).toBe('contacto@negocio.mx')
  })

  it('trata email vacío como null (es opcional)', () => {
    const resultado = validarCliente({ nombre_negocio: 'X', email: '  ' })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.email).toBeNull()
  })

  it('rechaza email con formato inválido', () => {
    for (const email of ['no-es-email', 'a@b', 'a b@c.com', '@x.com']) {
      const resultado = validarCliente({ nombre_negocio: 'X', email })
      expect(resultado.ok).toBe(false)
      if (resultado.ok) return
      expect(resultado.errores.email).toBeTruthy()
    }
  })

  it('coerciona montos que llegan como string desde FormData', () => {
    const resultado = validarCliente({
      nombre_negocio: 'X',
      presupuesto_ads: '1500.50',
      meta_facturacion: '80000',
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.presupuesto_ads).toBe(1500.5)
    expect(resultado.datos.meta_facturacion).toBe(80000)
  })

  it('acepta montos como number y string vacío como 0', () => {
    const resultado = validarCliente({
      nombre_negocio: 'X',
      presupuesto_ads: 300,
      meta_facturacion: '',
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.presupuesto_ads).toBe(300)
    expect(resultado.datos.meta_facturacion).toBe(0)
  })

  it('rechaza montos negativos', () => {
    const resultado = validarCliente({
      nombre_negocio: 'X',
      presupuesto_ads: '-1',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.presupuesto_ads).toBeTruthy()
  })

  it('rechaza montos no numéricos', () => {
    const resultado = validarCliente({
      nombre_negocio: 'X',
      meta_facturacion: 'mucho',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.meta_facturacion).toBeTruthy()
  })

  it('acumula errores de varios campos a la vez', () => {
    const resultado = validarCliente({
      nombre_negocio: ' ',
      email: 'malo',
      presupuesto_ads: 'xyz',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(Object.keys(resultado.errores).sort()).toEqual([
      'email',
      'nombre_negocio',
      'presupuesto_ads',
    ])
  })
})

describe('validarUsuarioCliente', () => {
  it('acepta datos completos y recorta nombre y email', () => {
    const resultado = validarUsuarioCliente({
      nombre: ' Ana ',
      email: ' ana@negocio.mx ',
      password: 'secreta123',
    })
    expect(resultado).toEqual({
      ok: true,
      datos: {
        nombre: 'Ana',
        email: 'ana@negocio.mx',
        password: 'secreta123',
      },
    })
  })

  it('rechaza nombre ausente o vacío', () => {
    const resultado = validarUsuarioCliente({
      email: 'ana@negocio.mx',
      password: 'secreta123',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.nombre).toBeTruthy()
  })

  it('rechaza email ausente (aquí es obligatorio)', () => {
    const resultado = validarUsuarioCliente({
      nombre: 'Ana',
      password: 'secreta123',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.email).toBeTruthy()
  })

  it('rechaza email inválido', () => {
    const resultado = validarUsuarioCliente({
      nombre: 'Ana',
      email: 'no-es-email',
      password: 'secreta123',
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores.email).toBeTruthy()
  })

  it('rechaza password ausente o menor a 8 caracteres', () => {
    const sinPassword = validarUsuarioCliente({
      nombre: 'Ana',
      email: 'ana@negocio.mx',
    })
    expect(sinPassword.ok).toBe(false)
    if (sinPassword.ok) return
    expect(sinPassword.errores.password).toBeTruthy()

    const corta = validarUsuarioCliente({
      nombre: 'Ana',
      email: 'ana@negocio.mx',
      password: '1234567',
    })
    expect(corta.ok).toBe(false)
    if (corta.ok) return
    expect(corta.errores.password).toBeTruthy()
  })

  it('acepta password de exactamente 8 caracteres sin recortarla', () => {
    const resultado = validarUsuarioCliente({
      nombre: 'Ana',
      email: 'ana@negocio.mx',
      password: ' 1234 67',
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.password).toBe(' 1234 67')
  })

  it('acumula errores de varios campos a la vez', () => {
    const resultado = validarUsuarioCliente({})
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(Object.keys(resultado.errores).sort()).toEqual([
      'email',
      'nombre',
      'password',
    ])
  })
})
