/**
 * Validación pura de citas y pendientes (Server Actions de la agenda).
 * Recibe los valores de texto del formulario y devuelve datos listos para
 * insertar o errores por campo.
 */
import { esUuid } from '@/lib/uuid'

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export const TIPOS_CITA = [
  { value: 'junta', label: 'Junta' },
  { value: 'sesion', label: 'Sesión' },
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'pago', label: 'Pago' },
  { value: 'otro', label: 'Otro' },
] as const
export type TipoCita = (typeof TIPOS_CITA)[number]['value']

export const AVISOS_MIN = [
  { value: '', label: 'Sin aviso' },
  { value: '10', label: '10 min antes' },
  { value: '30', label: '30 min antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 día antes' },
] as const

export type DatosCita = {
  titulo: string
  fecha: string
  hora: string | null
  hora_fin: string | null
  lugar: string | null
  aviso_min: number | null
  cliente_id: string | null
  descripcion: string | null
  tipo: TipoCita
}

export type DatosPendiente = {
  titulo: string
  fecha_limite: string | null
  hora: string | null
  cliente_id: string | null
}

type Resultado<T> = { ok: true; datos: T } | { ok: false; errores: Record<string, string> }

const texto = (v: string | undefined) => (v ?? '').trim()
const nulo = (v: string | undefined) => texto(v) || null

export function validarCita(v: Record<string, string>): Resultado<DatosCita> {
  const errores: Record<string, string> = {}

  const titulo = texto(v.titulo)
  if (!titulo) errores.titulo = 'Ponle título a la cita'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const fecha = texto(v.fecha)
  if (!FECHA.test(fecha)) errores.fecha = 'Elige el día'

  const hora = nulo(v.hora)
  if (hora && !HORA.test(hora)) errores.hora = 'Hora no válida'

  // Sin hora = todo el día: no aplica hora de fin ni aviso previo.
  let horaFin = hora ? nulo(v.hora_fin) : null
  if (horaFin && !HORA.test(horaFin)) errores.hora_fin = 'Hora no válida'
  else if (horaFin && hora && horaFin <= hora) errores.hora_fin = 'Debe terminar después de empezar'
  if (errores.hora_fin) horaFin = null

  const avisoTexto = texto(v.aviso_min)
  if (!AVISOS_MIN.some((a) => a.value === avisoTexto)) errores.aviso_min = 'Opción no válida'
  const avisoMin = hora && avisoTexto ? Number(avisoTexto) : null

  const clienteId = nulo(v.cliente_id)
  if (clienteId && !esUuid(clienteId)) errores.cliente_id = 'Cliente no válido'

  const tipo = (texto(v.tipo) || 'junta') as TipoCita
  if (!TIPOS_CITA.some((t) => t.value === tipo)) errores.tipo = 'Tipo no válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return {
    ok: true,
    datos: {
      titulo, fecha, hora, hora_fin: horaFin, lugar: nulo(v.lugar), aviso_min: avisoMin,
      cliente_id: clienteId, descripcion: nulo(v.descripcion), tipo,
    },
  }
}

export function validarPendiente(v: Record<string, string>): Resultado<DatosPendiente> {
  const errores: Record<string, string> = {}

  const titulo = texto(v.titulo)
  if (!titulo) errores.titulo = 'Escribe el pendiente'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const fecha = nulo(v.fecha_limite)
  if (fecha && !FECHA.test(fecha)) errores.fecha_limite = 'Fecha no válida'

  const hora = nulo(v.hora)
  if (hora && !HORA.test(hora)) errores.hora = 'Hora no válida'

  const clienteId = nulo(v.cliente_id)
  if (clienteId && !esUuid(clienteId)) errores.cliente_id = 'Cliente no válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return { ok: true, datos: { titulo, fecha_limite: fecha, hora, cliente_id: clienteId } }
}
