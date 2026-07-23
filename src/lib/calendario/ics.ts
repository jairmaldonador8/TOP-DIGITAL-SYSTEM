/**
 * Generador iCalendar (RFC 5545) del feed de suscripción: puro, sin
 * dependencias. Google Calendar consume esto vía "Agregar por URL".
 */
import type { ElementoCalendario, TipoElemento } from './tipos'

const DOMINIO = 'topdigital.company'

const PREFIJO: Record<TipoElemento, string> = {
  campania: '📣',
  encargo: '🎬',
  tarea: '✅',
  evento: '📅',
}

/** Escapa texto para propiedades ICS (RFC 5545 §3.3.11). */
export function escaparICS(texto: string): string {
  return texto
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n')
}

/**
 * Pliega una línea a máximo 75 octetos (continuación " ") sin partir
 * caracteres multibyte: se mide en UTF-8 pero se corta por code points
 * completos (los emoji de SUMMARY hacen real este borde).
 */
export function plegarLinea(linea: string): string {
  const LIMITE = 75
  if (Buffer.byteLength(linea, 'utf8') <= LIMITE) return linea

  const partes: string[] = []
  let actual = ''
  let octetos = 0
  let limite = LIMITE
  for (const caracter of linea) {
    const tam = Buffer.byteLength(caracter, 'utf8')
    if (octetos + tam > limite) {
      partes.push(actual)
      actual = ' '
      octetos = 1
      limite = LIMITE
    }
    actual += caracter
    octetos += tam
  }
  if (actual) partes.push(actual)
  return partes.join('\r\n')
}

function lineaFecha(elemento: ElementoCalendario): string[] {
  const compacta = elemento.fecha.replaceAll('-', '')
  if (!elemento.hora) return [`DTSTART;VALUE=DATE:${compacta}`]
  // Hora local flotante (sin Z/TZID): Google la pinta en la zona del
  // calendario del dueño (México). Duración fija de 1 hora.
  const hhmm = elemento.hora.replace(':', '').slice(0, 4)
  return [`DTSTART:${compacta}T${hhmm}00`, 'DURATION:PT1H']
}

export function generarICS(elementos: ElementoCalendario[]): string {
  const lineas: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Top Digital//Calendario//ES',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Top Digital',
  ]

  for (const elemento of elementos) {
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${elemento.uid}@${DOMINIO}`,
      // DTSTAMP es obligatorio; el feed se regenera al vuelo, así que la
      // fecha del elemento (estable) evita que Google vea "cambios" falsos.
      `DTSTAMP:${elemento.fecha.replaceAll('-', '')}T000000Z`,
      ...lineaFecha(elemento),
      `SUMMARY:${escaparICS(`${PREFIJO[elemento.tipo]} ${elemento.titulo}`)}`
    )
    if (elemento.detalle) {
      lineas.push(`DESCRIPTION:${escaparICS(elemento.detalle)}`)
    }
    lineas.push('END:VEVENT')
  }

  lineas.push('END:VCALENDAR')
  return lineas.map(plegarLinea).join('\r\n') + '\r\n'
}
