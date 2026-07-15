/**
 * Validadores puros para el CRUD de clientes y sus usuarios.
 *
 * Reciben valores crudos (típicamente strings de FormData), los recortan
 * y coercionan, y devuelven datos limpios listos para insertar/actualizar
 * o un mapa de errores por campo en español.
 */

export type ResultadoValidacion<T> =
  | { ok: true; datos: T }
  | { ok: false; errores: Record<string, string> }

export type DatosCliente = {
  nombre_negocio: string
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  presupuesto_ads: number
  meta_facturacion: number
  notas: string | null
}

export type DatosUsuarioCliente = {
  nombre: string
  email: string
  password: string
}

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Convierte un valor crudo a texto recortado, o null si queda vacío. */
function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio === '' ? null : limpio
}

/**
 * Coerciona un monto opcional (string de FormData o number) a número >= 0.
 * Vacío/ausente cuenta como 0 (el default de la base de datos).
 */
function monto(valor: unknown): { valido: true; numero: number } | { valido: false } {
  if (valor === undefined || valor === null) return { valido: true, numero: 0 }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) && valor >= 0
      ? { valido: true, numero: valor }
      : { valido: false }
  }
  if (typeof valor !== 'string') return { valido: false }
  const limpio = valor.trim()
  if (limpio === '') return { valido: true, numero: 0 }
  const numero = Number(limpio)
  return Number.isFinite(numero) && numero >= 0
    ? { valido: true, numero }
    : { valido: false }
}

export function validarCliente(
  entrada: Record<string, unknown>
): ResultadoValidacion<DatosCliente> {
  const errores: Record<string, string> = {}

  const nombreNegocio = texto(entrada.nombre_negocio)
  if (!nombreNegocio) {
    errores.nombre_negocio = 'El nombre del negocio es obligatorio'
  }

  const email = texto(entrada.email)
  if (email && !PATRON_EMAIL.test(email)) {
    errores.email = 'Escribe un correo electrónico válido'
  }

  const presupuesto = monto(entrada.presupuesto_ads)
  if (!presupuesto.valido) {
    errores.presupuesto_ads = 'Debe ser un número mayor o igual a 0'
  }

  const meta = monto(entrada.meta_facturacion)
  if (!meta.valido) {
    errores.meta_facturacion = 'Debe ser un número mayor o igual a 0'
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      nombre_negocio: nombreNegocio as string,
      contacto_nombre: texto(entrada.contacto_nombre),
      email,
      telefono: texto(entrada.telefono),
      presupuesto_ads: presupuesto.valido ? presupuesto.numero : 0,
      meta_facturacion: meta.valido ? meta.numero : 0,
      notas: texto(entrada.notas),
    },
  }
}

export function validarUsuarioCliente(
  entrada: Record<string, unknown>
): ResultadoValidacion<DatosUsuarioCliente> {
  const errores: Record<string, string> = {}

  const nombre = texto(entrada.nombre)
  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio'
  }

  const email = texto(entrada.email)
  if (!email) {
    errores.email = 'El correo electrónico es obligatorio'
  } else if (!PATRON_EMAIL.test(email)) {
    errores.email = 'Escribe un correo electrónico válido'
  }

  // La contraseña NO se recorta: los espacios son parte de ella.
  const password = typeof entrada.password === 'string' ? entrada.password : ''
  if (password.length === 0) {
    errores.password = 'La contraseña es obligatoria'
  } else if (password.length < 8) {
    errores.password = 'La contraseña debe tener al menos 8 caracteres'
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      nombre: nombre as string,
      email: email as string,
      password,
    },
  }
}
