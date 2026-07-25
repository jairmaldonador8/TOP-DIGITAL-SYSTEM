/**
 * Reporte semanal automático (spec 2026-07-25): funciones puras de rango
 * y redacción. La generación (queries + upsert) vive en semanal-server.ts.
 *
 * La semana reportada va de lunes 00:00 a domingo 24:00 en hora de México
 * (UTC-6 fijo desde 2022: sin horario de verano).
 */

const HORA_MX_MS = 6 * 60 * 60 * 1000

export type RangoSemana = {
  /** Lunes de la semana reportada, 'YYYY-MM-DD' (clave del upsert). */
  inicio: string
  /** Domingo de la semana reportada, 'YYYY-MM-DD' (para mostrar). */
  fin: string
  /** Frontera inicial en UTC (lunes 00:00 MX), inclusiva. */
  desdeUtc: string
  /** Frontera final en UTC (lunes siguiente 00:00 MX), EXCLUSIVA. */
  hastaUtc: string
}

function aFecha(diasDesdeEpoch: number): string {
  return new Date(diasDesdeEpoch * 86_400_000).toISOString().slice(0, 10)
}

/** Rango de la semana pasada completa (lunes a domingo) en hora de México. */
export function rangoSemanaPasada(ahora: Date): RangoSemana {
  // Día actual en México, como días desde epoch (aritmética entera: sin DST).
  const diaMx = Math.floor((ahora.getTime() - HORA_MX_MS) / 86_400_000)
  const diaSemana = (new Date(diaMx * 86_400_000).getUTCDay() + 6) % 7 // 0 = lunes
  const lunesActual = diaMx - diaSemana
  const lunesPasado = lunesActual - 7

  return {
    inicio: aFecha(lunesPasado),
    fin: aFecha(lunesActual - 1),
    desdeUtc: `${aFecha(lunesPasado)}T06:00:00.000Z`,
    hastaUtc: `${aFecha(lunesActual)}T06:00:00.000Z`,
  }
}

export type DatosReporte = {
  leadsNuevos: number
  cierres: number
  montoCerrado: number
  seguimientos: number
  encargosEntregados: number
  encargosAprobados: number
  encargosAtrasados: number
  porCliente: {
    nombre: string
    leads: number
    cierres: number
    monto: number
  }[]
}

const pesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

/** Mensaje listo para reenviar por WhatsApp (sin IA: plantilla fija). */
export function textoWhatsApp(datos: DatosReporte, rango: RangoSemana): string {
  const lineas = [
    `📊 *Resumen semanal* (${rango.inicio} al ${rango.fin})`,
    '',
    `🧲 Leads nuevos: ${datos.leadsNuevos}`,
    `🤝 Ventas cerradas: ${datos.cierres} (${pesos.format(datos.montoCerrado)})`,
    `📞 Seguimientos hechos: ${datos.seguimientos}`,
    `📦 Encargos: ${datos.encargosEntregados} entregados · ${datos.encargosAprobados} aprobados` +
      (datos.encargosAtrasados > 0
        ? ` · ⚠️ ${datos.encargosAtrasados} atrasados`
        : ''),
  ]

  const top = datos.porCliente.slice(0, 5)
  if (top.length > 0) {
    lineas.push('', '*Por cliente:*')
    for (const c of top) {
      const venta = c.monto > 0 ? ` — ${pesos.format(c.monto)}` : ''
      lineas.push(`• ${c.nombre}: ${c.leads} leads, ${c.cierres} cierres${venta}`)
    }
  }

  lineas.push('', '— Top Digital')
  return lineas.join('\n')
}
