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

  it('rechaza título vacío, fecha inválida, fin antes del inicio y aviso no numérico', () => {
    const r = validarCita({ titulo: ' ', fecha: '26/09', hora: '10:00', hora_fin: '09:00', aviso_min: 'abc' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(['aviso_min', 'fecha', 'hora_fin', 'titulo'])
    }
  })

  it('acepta avisos fuera de la lista entre 0 y 7 días; rechaza los que se pasan', () => {
    const base = { titulo: 'Junta', fecha: '2026-09-26', hora: '10:00' }
    expect(validarCita({ ...base, aviso_min: '7' })).toMatchObject({ ok: true, datos: { aviso_min: 7 } })
    expect(validarCita({ ...base, aviso_min: '10080' }).ok).toBe(true)
    const r = validarCita({ ...base, aviso_min: '99999' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores)).toEqual(['aviso_min'])
    expect(validarCita({ ...base, aviso_min: '-5' }).ok).toBe(false)
  })

  it('las opciones de aviso incluyen "sin aviso"', () => {
    expect(AVISOS_MIN.map((a) => a.value)).toContain('')
  })

  it('acepta HH:MM:SS (formularios de edición prellenados desde Postgres)', () => {
    const r = validarCita({
      titulo: 'Junta', fecha: '2026-09-26', hora: '10:00:00', hora_fin: '11:00:00', aviso_min: '',
    })
    expect(r.ok && r.datos).toMatchObject({ hora: '10:00', hora_fin: '11:00' })
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

  it('sin fecha límite, la hora no tiene sentido y se descarta', () => {
    const r = validarPendiente({ titulo: 'Pagar tarjeta', hora: '10:00' })
    expect(r.ok && r.datos.hora).toBeNull()
  })

  it('acepta HH:MM:SS (formularios de edición prellenados desde Postgres)', () => {
    const r = validarPendiente({ titulo: 'Pagar tarjeta', fecha_limite: '2026-09-26', hora: '10:00:00' })
    expect(r.ok && r.datos.hora).toBe('10:00')
  })
})
