import { describe, expect, it } from 'vitest'

import { piezasDelCiclo } from '../ciclo'

const equipo = { disenador: 'u-dis', editor: 'u-edi', filmmaker: 'u-fil', project_manager: 'u-pm' }

describe('piezasDelCiclo', () => {
  it('crea una pieza por unidad de cuota con su responsable y fechas', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: 2, video: 1, produccion: 1 },
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p.map((x) => `${x.tipo}#${x.pieza}`)).toEqual([
      'produccion#1', 'imagen#1', 'imagen#2', 'video#1',
    ])
    const img = p.find((x) => x.tipo === 'imagen')!
    expect(img.asignadoA).toBe('u-dis')
    expect(img.fechaCliente).toBe('2026-12-01')
    expect(img.fechaLimite).toBe('2026-11-27')
    expect(img.estadoInicial).toBe('pendiente')
  })

  it('los videos esperan a la producción del ciclo si existe', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { video: 2, produccion: 1 },
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    for (const v of p.filter((x) => x.tipo === 'video')) {
      expect(v.estadoInicial).toBe('esperando')
      expect(v.dependeDeProduccion).toBe(true)
    }
  })

  it('sin producción en la cuota, el video arranca pendiente', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { video: 1 }, equipo,
      responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p[0].estadoInicial).toBe('pendiente')
    expect(p[0].dependeDeProduccion).toBe(false)
  })

  it('sin responsable del puesto, se asigna al de por defecto y se marca', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { carrusel: 1 }, equipo: {},
      responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p[0].asignadoA).toBe('u-tadeo')
    expect(p[0].sinResponsable).toBe(true)
  })

  it('cliente nuevo: prioridad alta', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: 1 }, equipo,
      responsablePorDefecto: 'u-tadeo', esNuevo: true,
    })
    expect(p[0].prioridad).toBe('alta')
  })

  it('ignora valores inválidos de cuota', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: -1, video: 1.5, otro: 3 } as never,
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p).toEqual([])
  })
})
