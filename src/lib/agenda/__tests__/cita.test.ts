import { describe, expect, it } from 'vitest'

import { AVISOS_MIN, validarCita, validarPendiente } from '../cita'

const UUID = '3f2b8c1e-1d2a-4b5c-9d8e-7f6a5b4c3d2e'

describe('validarCita', () => {
  it('acepta una cita completa y normaliza vacíos a null', () => {
    const r = validarCita({
      titulo: '  Junta OfficeTure ', fecha: '2026-09-26', hora: '10:00', hora_fin: '11:00',
      lugar: '', aviso_min: '30', cliente_id: UUID, descripcion: '', tipo: 'junta',
    })
    expect(r).toEqual({
      ok: true,
      datos: {
        titulo: 'Junta OfficeTure', fecha: '2026-09-26', hora: '10:00', hora_fin: '11:00',
        lugar: null, aviso_min: 30, cliente_id: UUID, descripcion: null, tipo: 'junta',
      },
    })
  })

  it('todo el día: sin hora no hay hora_fin ni aviso previo', () => {
    const r = validarCita({ titulo: 'Pago', fecha: '2026-09-26', hora: '', hora_fin: '12:00', aviso_min: '30' })
    expect(r.ok && r.datos).toMatchObject({ hora: null, hora_fin: null, aviso_min: null })
  })

  it('rechaza título vacío, fecha inválida, fin antes del inicio y aviso fuera de lista', () => {
    const r = validarCita({ titulo: ' ', fecha: '26/09', hora: '10:00', hora_fin: '09:00', aviso_min: '7' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(['aviso_min', 'fecha', 'hora_fin', 'titulo'])
    }
  })

  it('las opciones de aviso incluyen "sin aviso"', () => {
    expect(AVISOS_MIN.map((a) => a.value)).toContain('')
  })
})

describe('validarPendiente', () => {
  it('cliente y fecha opcionales', () => {
    expect(validarPendiente({ titulo: 'Pagar tarjeta' })).toEqual({
      ok: true,
      datos: { titulo: 'Pagar tarjeta', fecha_limite: null, hora: null, cliente_id: null },
    })
  })

  it('rechaza cliente con forma inválida', () => {
    const r = validarPendiente({ titulo: 'x', cliente_id: 'nope' })
    expect(r.ok).toBe(false)
  })
})
