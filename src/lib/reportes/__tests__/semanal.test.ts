import { describe, expect, it } from 'vitest'

import {
  rangoSemanaPasada,
  textoWhatsApp,
  type DatosReporte,
} from '@/lib/reportes/semanal'

describe('rangoSemanaPasada', () => {
  // Lunes 2026-07-20 08:00 CDMX = 14:00 UTC (hora real del cron).
  it('en lunes por la mañana reporta la semana que acaba de terminar', () => {
    const rango = rangoSemanaPasada(new Date('2026-07-20T14:00:00Z'))
    expect(rango.inicio).toBe('2026-07-13')
    expect(rango.fin).toBe('2026-07-19')
    expect(rango.desdeUtc).toBe('2026-07-13T06:00:00.000Z')
    expect(rango.hastaUtc).toBe('2026-07-20T06:00:00.000Z')
  })

  it('cualquier día de la semana reporta la misma semana pasada', () => {
    // Miércoles y domingo de la misma semana → mismo rango.
    const miercoles = rangoSemanaPasada(new Date('2026-07-22T18:00:00Z'))
    const domingo = rangoSemanaPasada(new Date('2026-07-26T23:00:00Z'))
    expect(miercoles.inicio).toBe('2026-07-13')
    expect(domingo.inicio).toBe('2026-07-13')
  })

  it('respeta la frontera de México: lunes 00:00-05:59 UTC aún es domingo MX', () => {
    // 2026-07-20T05:00Z = domingo 19 a las 23:00 en México → la semana
    // pasada sigue siendo la del 6 al 12.
    const rango = rangoSemanaPasada(new Date('2026-07-20T05:00:00Z'))
    expect(rango.inicio).toBe('2026-07-06')
    expect(rango.fin).toBe('2026-07-12')
  })
})

describe('textoWhatsApp', () => {
  const datos: DatosReporte = {
    leadsNuevos: 12,
    cierres: 3,
    montoCerrado: 45000,
    seguimientos: 28,
    encargosEntregados: 4,
    encargosAprobados: 2,
    encargosAtrasados: 1,
    porCliente: [
      { nombre: 'Tacos El Patrón', leads: 8, cierres: 2, monto: 30000 },
      { nombre: 'Dental Sonrisa', leads: 4, cierres: 1, monto: 15000 },
    ],
  }
  const rango = {
    inicio: '2026-07-13',
    fin: '2026-07-19',
    desdeUtc: '',
    hastaUtc: '',
  }

  it('incluye los KPIs y el desglose por cliente', () => {
    const texto = textoWhatsApp(datos, rango)
    expect(texto).toContain('Resumen semanal')
    expect(texto).toContain('Leads nuevos: 12')
    expect(texto).toContain('Ventas cerradas: 3')
    expect(texto).toContain('$45,000')
    expect(texto).toContain('⚠️ 1 atrasados')
    expect(texto).toContain('Tacos El Patrón: 8 leads, 2 cierres — $30,000')
  })

  it('omite la advertencia de atrasados cuando no hay', () => {
    const texto = textoWhatsApp({ ...datos, encargosAtrasados: 0 }, rango)
    expect(texto).not.toContain('atrasados')
  })

  it('omite el desglose cuando no hay clientes', () => {
    const texto = textoWhatsApp({ ...datos, porCliente: [] }, rango)
    expect(texto).not.toContain('Por cliente')
  })
})
