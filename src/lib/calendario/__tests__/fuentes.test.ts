import { describe, expect, it } from 'vitest'

import { construirElementos } from '../fuentes'

const base = {
  campanias: [],
  encargos: [],
  tareas: [],
  eventos: [],
  nombresIntegrantes: new Map<string, string>(),
}

describe('construirElementos', () => {
  it('mapea las 4 fuentes con sus uid, prefijos y detalle', () => {
    const elementos = construirElementos({
      campanias: [
        {
          id: 'c1',
          nombre: 'Promo julio',
          fecha_inicio: '2026-07-10',
          clientes: { nombre_negocio: 'OfficeTure' },
        },
      ],
      encargos: [
        { id: 'e1', titulo: '3 posts', fecha_limite: '2026-07-05', asignado_a: 'u1' },
      ],
      tareas: [
        {
          id: 't1',
          titulo: 'Reporte mensual',
          fecha_limite: '2026-07-20',
          hora: null,
          clientes: null,
        },
      ],
      eventos: [
        {
          id: 'v1',
          titulo: 'Sesión de fotos',
          descripcion: 'Estudio centro',
          fecha: '2026-07-15',
          hora: '14:30:00',
          hora_fin: null,
          lugar: 'Estudio centro',
          aviso_min: null,
          origen: 'sistema',
          tipo: 'sesion',
          cliente_id: null,
          clientes: { nombre_negocio: 'Linda Vargas' },
        },
      ],
      nombresIntegrantes: new Map([['u1', 'Ana']]),
    })

    expect(elementos.map((e) => e.uid)).toEqual([
      'encargo:e1',
      'campania:c1',
      'evento:v1',
      'tarea:t1',
    ])
    expect(elementos[0].detalle).toBe('Ana')
    expect(elementos[0].cliente).toBeNull()
    expect(elementos[1].titulo).toBe('Arranca: Promo julio')
    expect(elementos[1].cliente).toBe('OfficeTure')
    expect(elementos[2].hora).toBe('14:30')
    expect(elementos[2].detalle).toBe('Linda Vargas · Estudio centro')
    expect(elementos[2].subtipo).toBe('sesion')
    expect(elementos[2].cliente).toBe('Linda Vargas')
    expect(elementos[3].cliente).toBeNull()
  })

  it('ordena por fecha, luego hora (sin hora al final), luego título', () => {
    const elementos = construirElementos({
      ...base,
      eventos: [
        {
          id: 'a',
          titulo: 'B tarde',
          descripcion: null,
          fecha: '2026-07-15',
          hora: '16:00:00',
          hora_fin: null,
          lugar: null,
          aviso_min: null,
          origen: 'sistema',
          tipo: 'junta',
          cliente_id: null,
          clientes: null,
        },
        {
          id: 'b',
          titulo: 'A sin hora',
          descripcion: null,
          fecha: '2026-07-15',
          hora: null,
          hora_fin: null,
          lugar: null,
          aviso_min: null,
          origen: 'sistema',
          tipo: 'junta',
          cliente_id: null,
          clientes: null,
        },
        {
          id: 'c',
          titulo: 'C mañana',
          descripcion: null,
          fecha: '2026-07-15',
          hora: '09:00:00',
          hora_fin: null,
          lugar: null,
          aviso_min: null,
          origen: 'sistema',
          tipo: 'junta',
          cliente_id: null,
          clientes: null,
        },
      ],
    })
    expect(elementos.map((e) => e.titulo)).toEqual([
      'C mañana',
      'B tarde',
      'A sin hora',
    ])
  })

  it('integrante desconocido deja detalle null', () => {
    const elementos = construirElementos({
      ...base,
      encargos: [
        { id: 'e1', titulo: 'X', fecha_limite: '2026-07-05', asignado_a: 'nadie' },
      ],
    })
    expect(elementos[0].detalle).toBeNull()
  })

  it('las citas llevan horaFin, lugar, origen y avisoMin; el detalle incluye el lugar', () => {
    const [cita] = construirElementos({
      ...base,
      eventos: [
        {
          id: 'v9', titulo: 'Junta', descripcion: null, fecha: '2026-09-26', hora: '10:00:00',
          hora_fin: '11:00:00', lugar: 'Oficina', aviso_min: 30, origen: 'google', tipo: 'junta',
          cliente_id: null, clientes: { nombre_negocio: 'OfficeTure' },
        },
      ],
    })
    expect(cita).toMatchObject({
      hora: '10:00', horaFin: '11:00', lugar: 'Oficina', origen: 'google', avisoMin: 30,
      detalle: 'OfficeTure · Oficina', cliente: 'OfficeTure',
    })
  })
})
