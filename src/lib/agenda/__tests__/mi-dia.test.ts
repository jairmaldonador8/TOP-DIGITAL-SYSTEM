import { describe, expect, it } from 'vitest'

import { construirMiDia } from '../mi-dia'
import type { CitaDia } from '../tipos'

const HOY = '2026-09-26'

const cita = (p: Partial<CitaDia>): CitaDia => ({
  id: 'c', titulo: 'Cita', fecha: HOY, hora: '10:00', horaFin: null, lugar: null,
  cliente: null, origen: 'sistema', avisoMin: 30, descripcion: null, clienteId: null, tipo: 'junta', ...p,
})

describe('construirMiDia', () => {
  it('solo muestra citas de hoy: primero las de todo el día, luego por hora', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [
        cita({ id: 'b', hora: '13:30' }),
        cita({ id: 'x', fecha: '2026-09-27' }),
        cita({ id: 'a', hora: '09:00' }),
        cita({ id: 't', hora: null }),
      ],
      pendientes: [],
      entregas: [],
    })
    expect(r.citas.map((c) => c.id)).toEqual(['t', 'a', 'b'])
    expect(r.conteo.citas).toBe(3)
  })

  it('pendientes: atrasados primero, luego hoy (por hora), luego sin fecha; oculta futuros', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [],
      pendientes: [
        { id: 'sin', titulo: 'Sin fecha', fecha: null, hora: null, cliente: null },
        { id: 'fut', titulo: 'Mañana', fecha: '2026-09-27', hora: null, cliente: null },
        { id: 'hoy2', titulo: 'Hoy tarde', fecha: HOY, hora: '18:00', cliente: null },
        { id: 'hoy1', titulo: 'Hoy', fecha: HOY, hora: null, cliente: 'OfficeTure' },
        { id: 'atr', titulo: 'Atrasado', fecha: '2026-09-20', hora: null, cliente: null },
      ],
      entregas: [],
    })
    expect(r.pendientes.map((p) => p.id)).toEqual(['atr', 'hoy1', 'hoy2', 'sin'])
    expect(r.pendientes[0].atrasado).toBe(true)
    expect(r.pendientes[1].atrasado).toBe(false)
    expect(r.conteo.pendientes).toBe(4)
    expect(r.conteo.atrasados).toBe(1)
  })

  it('entregas: solo las de hoy o atrasadas; las atrasadas suman a atrasados', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [],
      pendientes: [],
      entregas: [
        { id: 'e1', titulo: 'Landing', fecha: HOY, integrante: 'Jair' },
        { id: 'e2', titulo: 'Posts', fecha: '2026-09-24', integrante: 'Jair' },
        { id: 'e3', titulo: 'Video', fecha: '2026-10-01', integrante: 'Jair' },
      ],
    })
    expect(r.entregas.map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(r.conteo.entregasHoy).toBe(1)
    expect(r.conteo.atrasados).toBe(1)
  })
})
