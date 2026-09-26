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
  for (const caracter of linea) {
    const tam = Buffer.byteLength(caracter, 'utf8')
    if (octetos + tam > LIMITE) {
      partes.push(actual)
      // El espacio de continuación cuenta dentro de los 75 octetos.
      actual = ' '
      octetos = 1
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
  // calendario del dueño (México).
  const hhmm = elemento.hora.replace(':', '').slice(0, 4)
  if (elemento.horaFin) {
    const hhmmFin = elemento.horaFin.replace(':', '').slice(0, 4)
    return [`DTSTART:${compacta}T${hhmm}00`, `DTEND:${compacta}T${hhmmFin}00`]
  }
  // Sin fin conocido (campañas, tareas, etc.): duración fija de 1 hora.
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
    // DESCRIPTION combina el detalle (contexto) con la descripción de la
    // cita, cuando existen; una sola de las dos también basta.
    const descripcion = [elemento.detalle, elemento.descripcion]
      .filter(Boolean)
      .join('\n')
    if (descripcion) {
      lineas.push(`DESCRIPTION:${escaparICS(descripcion)}`)
    }
    if (elemento.lugar) {
      lineas.push(`LOCATION:${escaparICS(elemento.lugar)}`)
    }
    lineas.push('END:VEVENT')
  }

  lineas.push('END:VCALENDAR')
  return lineas.map(plegarLinea).join('\r\n') + '\r\n'
}
