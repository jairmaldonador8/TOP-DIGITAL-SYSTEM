import { describe, expect, it } from 'vitest'

import {
  esImagen,
  esMimePermitido,
  extensionDe,
  formatoTamano,
  normalizarMime,
  puedeAdjuntar,
} from '@/lib/equipo/evidencia'

describe('normalizarMime', () => {
  it('deja igual los mimes canónicos', () => {
    expect(normalizarMime('image/png')).toBe('image/png')
    expect(normalizarMime('application/pdf')).toBe('application/pdf')
  })

  it('normaliza las variantes de zip de Windows', () => {
    expect(normalizarMime('application/x-zip-compressed')).toBe('application/zip')
    expect(normalizarMime('application/zip-compressed')).toBe('application/zip')
  })

  it('ignora mayúsculas y espacios', () => {
    expect(normalizarMime(' Image/PNG ')).toBe('image/png')
  })
})

describe('esMimePermitido', () => {
  it('acepta imágenes, pdf, zip (y variantes) y mp4', () => {
    for (const mime of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'video/mp4',
    ]) {
      expect(esMimePermitido(mime), mime).toBe(true)
    }
  })

  it('rechaza ejecutables, svg y desconocidos', () => {
    for (const mime of [
      'application/x-msdownload',
      'image/svg+xml',
      'text/html',
      'application/octet-stream',
      '',
    ]) {
      expect(esMimePermitido(mime), mime).toBe(false)
    }
  })
})

describe('extensionDe', () => {
  it('deriva la extensión del mime, no del nombre', () => {
    expect(extensionDe('image/jpeg')).toBe('jpg')
    expect(extensionDe('application/x-zip-compressed')).toBe('zip')
    expect(extensionDe('video/mp4')).toBe('mp4')
  })

  it('devuelve null para mimes no permitidos', () => {
    expect(extensionDe('text/html')).toBeNull()
  })
})

describe('esImagen', () => {
  it('distingue imágenes de otros tipos', () => {
    expect(esImagen('image/webp')).toBe(true)
    expect(esImagen('application/pdf')).toBe(false)
  })
})

describe('puedeAdjuntar', () => {
  it('equipo solo con el trabajo en sus manos', () => {
    expect(puedeAdjuntar('equipo', 'en_progreso')).toBe(true)
    expect(puedeAdjuntar('equipo', 'cambios')).toBe(true)
    expect(puedeAdjuntar('equipo', 'pendiente')).toBe(false)
    expect(puedeAdjuntar('equipo', 'entregado')).toBe(false)
    expect(puedeAdjuntar('equipo', 'aprobado')).toBe(false)
  })

  it('admin siempre excepto aprobado (terminal)', () => {
    expect(puedeAdjuntar('admin', 'pendiente')).toBe(true)
    expect(puedeAdjuntar('admin', 'en_progreso')).toBe(true)
    expect(puedeAdjuntar('admin', 'entregado')).toBe(true)
    expect(puedeAdjuntar('admin', 'cambios')).toBe(true)
    expect(puedeAdjuntar('admin', 'aprobado')).toBe(false)
  })
})

describe('formatoTamano', () => {
  it('formatea B, KB y MB', () => {
    expect(formatoTamano(512)).toBe('512 B')
    expect(formatoTamano(830 * 1024)).toBe('830 KB')
    expect(formatoTamano(1.2 * 1024 * 1024)).toBe('1.2 MB')
  })
})
