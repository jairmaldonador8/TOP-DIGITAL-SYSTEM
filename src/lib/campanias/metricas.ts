/**
 * Agregaciones puras para el dashboard de campañas por cliente. Trabajan
 * sobre filas diarias YA sumadas por día entre las campañas del cliente
 * (la página hace esa suma). Las fechas son strings YYYY-MM-DD en hora de
 * México (`hoy` viene de hoyEnMexico()); toda la aritmética de fechas se
 * hace anclada a mediodía UTC para esquivar el bug de "día corrido" (#418).
 */

export type FilaDiaria = { fecha: string; gasto: number; conversaciones: number }
export type PuntoSerie = FilaDiaria

/** fecha ± dias, en YYYY-MM-DD (anclado a mediodía UTC, sin husos). */
function sumarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T12:00:00Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/** N puntos consecutivos terminando en hoy; días sin fila quedan en 0. */
export function serieDiaria(
  filas: FilaDiaria[],
  dias: number,
  hoy: string
): PuntoSerie[] {
  const porFecha = new Map(filas.map((f) => [f.fecha, f]))
  const serie: PuntoSerie[] = []
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = sumarDias(hoy, -i)
    const fila = porFecha.get(fecha)
    serie.push({
      fecha,
      gasto: fila?.gasto ?? 0,
      conversaciones: fila?.conversaciones ?? 0,
    })
  }
  return serie
}

export type Kpi = { valor: number | null; deltaPct: number | null }

/** Últimos 7 días vs los 7 anteriores. Delta null si la base fue 0. */
export function deltasSemana(
  filas: FilaDiaria[],
  hoy: string
): { conversaciones: Kpi; gasto: Kpi; cpl: Kpi } {
  const inicioActual = sumarDias(hoy, -6)
  const inicioAnterior = sumarDias(hoy, -13)

  let convActual = 0
  let convAnterior = 0
  let gastoActual = 0
  let gastoAnterior = 0
  for (const fila of filas) {
    if (fila.fecha >= inicioActual && fila.fecha <= hoy) {
      convActual += fila.conversaciones
      gastoActual += fila.gasto
    } else if (fila.fecha >= inicioAnterior && fila.fecha < inicioActual) {
      convAnterior += fila.conversaciones
      gastoAnterior += fila.gasto
    }
  }

  const delta = (actual: number, anterior: number): number | null =>
    anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null

  const cplActual = convActual > 0 ? gastoActual / convActual : null
  const cplAnterior = convAnterior > 0 ? gastoAnterior / convAnterior : null

  return {
    conversaciones: {
      valor: convActual,
      deltaPct: delta(convActual, convAnterior),
    },
    gasto: { valor: gastoActual, deltaPct: delta(gastoActual, gastoAnterior) },
    cpl: {
      valor: cplActual,
      deltaPct:
        cplActual !== null && cplAnterior !== null && cplAnterior > 0
          ? Math.round(((cplActual - cplAnterior) / cplAnterior) * 100)
          : null,
    },
  }
}

/** Suma del mes calendario en curso (hoy define el mes). */
export function gastoDelMes(filas: FilaDiaria[], hoy: string): number {
  const mes = hoy.slice(0, 7)
  let total = 0
  for (const fila of filas) {
    if (fila.fecha.slice(0, 7) === mes) total += fila.gasto
  }
  return total
}

/** Gasto proyectado al cierre del mes según el ritmo actual; null sin gasto. */
export function proyeccionMes(gastoMes: number, hoy: string): number | null {
  if (gastoMes <= 0) return null
  const dia = Number(hoy.slice(8, 10))
  const [anio, mes] = [Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7))]
  // Día 0 del mes siguiente = último día del mes actual (bisiestos incluidos).
  const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  return (gastoMes / dia) * diasDelMes
}
