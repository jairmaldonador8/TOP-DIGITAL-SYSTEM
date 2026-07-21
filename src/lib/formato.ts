/**
 * Formateadores es-MX compartidos por los paneles.
 *
 * Todas las fechas se muestran en hora del centro de México (el negocio es
 * mexicano). Fijar el timeZone hace además que servidor (UTC en Vercel) y
 * navegador rendericen EXACTAMENTE el mismo texto — sin esto, los client
 * components truenan con el error de hidratación #418.
 */
const ZONA = 'America/Mexico_City'

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

export function formatoMoneda(valor: number): string {
  return moneda.format(valor)
}

/**
 * Interpreta 'YYYY-MM-DD' anclado a mediodía UTC: así cae en el día
 * correcto al formatearse en hora de México. (`new Date('2026-07-03')` es
 * medianoche UTC, que en México todavía es 2 de julio.)
 */
function aFecha(iso: string): Date {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (soloFecha) {
    return new Date(
      Date.UTC(
        Number(soloFecha[1]),
        Number(soloFecha[2]) - 1,
        Number(soloFecha[3]),
        12
      )
    )
  }
  return new Date(iso)
}

const fechaCorta = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
})

/** "14 jul" a partir de un ISO date/timestamp. */
export function formatoFechaCorta(iso: string): string {
  return fechaCorta.format(aFecha(iso))
}

const horaCorta = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** "14 jul, 9:30 a.m." para mensajes y actividad. */
export function formatoFechaHora(iso: string): string {
  return horaCorta.format(aFecha(iso))
}

/** Primer día del mes actual en ISO, para filtrar "este mes". */
export function inicioDeMes(): string {
  const ahora = new Date()
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
}

/** Primer día del mes anterior en ISO, para comparativas. */
export function inicioDeMesAnterior(): string {
  const ahora = new Date()
  return new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString()
}

const fechaLarga = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "Domingo, 20 de julio" (con mayúscula inicial). */
export function formatoFechaLarga(fecha: Date = new Date()): string {
  const texto = fechaLarga.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const fechaMx = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 'YYYY-MM-DD' de HOY en hora de México. El servidor corre en UTC: usar
 * `toISOString()` marcaría tareas como vencidas desde las 6 pm del centro
 * del país.
 */
export function hoyEnMexico(): string {
  return fechaMx.format(new Date())
}
