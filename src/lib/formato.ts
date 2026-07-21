/** Formateadores es-MX compartidos por los paneles. */

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

export function formatoMoneda(valor: number): string {
  return moneda.format(valor)
}

const fechaCorta = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
})

/** "14 jul" a partir de un ISO date/timestamp. */
export function formatoFechaCorta(iso: string): string {
  return fechaCorta.format(new Date(iso))
}

const horaCorta = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** "14 jul, 9:30 a.m." para mensajes y actividad. */
export function formatoFechaHora(iso: string): string {
  return horaCorta.format(new Date(iso))
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
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "Domingo, 20 de julio" (con mayúscula inicial). */
export function formatoFechaLarga(fecha: Date = new Date()): string {
  const texto = fechaLarga.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
