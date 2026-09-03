'use server'

import { esUuid, valoresDe, type ResultadoAccion } from '@/lib/acciones'
import { enviarEmail } from '@/lib/email/email-server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ARRANQUE,
  FACTURACION,
  PRESUPUESTO,
  SI_NO,
} from '@/lib/sitio/formulario'
import { SERVICIOS } from '@/lib/sitio/servicios'

/**
 * Resultado de un paso intermedio: además de ok/errores devuelve el par
 * id + token con el que el navegador continúa al paso siguiente.
 */
export type ResultadoPaso =
  | { ok: true; id: string; token: string }
  | {
      ok: false
      errores: Record<string, string>
      valores: Record<string, string>
    }
  | null

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** 10 dígitos (nacional) o hasta 15 con lada internacional. */
const TELEFONO = /^\+?[\d\s()-]{10,20}$/

const SLUGS = new Set(SERVICIOS.map((s) => s.slug))

function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Falla genérica de escritura: nunca dejamos al prospecto sin salida. */
const FALLA_GUARDADO =
  'No pudimos guardar tus datos. Escríbenos por WhatsApp y lo resolvemos al momento.'

/**
 * Trampa antispam: campo oculto que una persona nunca llena. Si viene con
 * texto respondemos como si todo hubiera ido bien, sin escribir nada, para
 * no darle señal al bot.
 */
function esBot(formData: FormData) {
  return Boolean((formData.get('sitio_web') as string)?.trim())
}

/**
 * Lee el par id + token que el navegador arrastra entre pasos y comprueba
 * que ambos tengan forma de UUID antes de tocar la base.
 */
function credenciales(formData: FormData) {
  const id = ((formData.get('solicitud_id') as string) ?? '').trim()
  const token = ((formData.get('solicitud_token') as string) ?? '').trim()
  if (!esUuid(id) || !esUuid(token)) return null
  return { id, token }
}

// ───────────────────────── paso 1 · contacto ─────────────────────────

const CAMPOS_CONTACTO = ['nombre', 'apellido', 'telefono', 'email']

/**
 * Paso 1: guarda el contacto en cuanto lo tenemos.
 *
 * Aquí está el cambio de fondo respecto a la versión anterior: la
 * solicitud se inserta con solo estos cuatro datos. Si el prospecto
 * abandona el formulario en el paso 2 o 3, el equipo conserva igual su
 * WhatsApp y su correo para buscarlo.
 */
export async function guardarContacto(
  _prev: ResultadoPaso,
  formData: FormData
): Promise<ResultadoPaso> {
  const valores = valoresDe(formData, CAMPOS_CONTACTO)
  const errores: Record<string, string> = {}

  if (esBot(formData))
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }

  const nombre = (valores.nombre ?? '').trim()
  if (!nombre) errores.nombre = 'Escribe tu nombre'
  else if (nombre.length > 80) errores.nombre = 'Máximo 80 caracteres'

  const apellido = (valores.apellido ?? '').trim()
  if (!apellido) errores.apellido = 'Escribe tu apellido'
  else if (apellido.length > 80) errores.apellido = 'Máximo 80 caracteres'

  const telefono = (valores.telefono ?? '').trim()
  if (!telefono) errores.telefono = 'Escribe tu WhatsApp'
  else if (!TELEFONO.test(telefono))
    errores.telefono = 'Escribe 10 dígitos, con lada si es del extranjero'

  const email = (valores.email ?? '').trim()
  if (!email) errores.email = 'Escribe el correo de tu empresa'
  else if (!EMAIL.test(email)) errores.email = 'Ese correo no parece válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('solicitudes_sitio')
    .insert({
      nombre,
      apellido,
      telefono,
      email,
      paso: 1,
      origen: 'sitio-agendar',
    })
    .select('id, token')
    .single()

  if (error || !data) {
    console.error('Error al guardar el contacto del sitio:', error)
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }
  }

  return { ok: true, id: data.id, token: data.token }
}

// ───────────────────────── paso 2 · el negocio ─────────────────────────

const CAMPOS_NEGOCIO = [
  'empresa',
  'giro',
  'sitio_actual',
  'facturacion',
  'es_dueno',
]

const OPCIONES_NEGOCIO: Record<string, readonly string[]> = {
  facturacion: FACTURACION,
  es_dueno: SI_NO,
}

/** Paso 2: completa el perfil del negocio sobre la fila del paso 1. */
export async function guardarNegocio(
  _prev: ResultadoPaso,
  formData: FormData
): Promise<ResultadoPaso> {
  const valores = valoresDe(formData, CAMPOS_NEGOCIO)
  const errores: Record<string, string> = {}

  if (esBot(formData))
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }

  const cred = credenciales(formData)
  if (!cred)
    return {
      ok: false,
      errores: { _form: 'Se perdió tu sesión. Vuelve a empezar, por favor.' },
      valores,
    }

  const empresa = (valores.empresa ?? '').trim()
  if (!empresa) errores.empresa = 'Escribe el nombre de tu empresa'
  else if (empresa.length > 120) errores.empresa = 'Máximo 120 caracteres'

  const giro = (valores.giro ?? '').trim()
  if (!giro) errores.giro = 'Cuéntanos a qué se dedica'
  else if (giro.length > 200) errores.giro = 'Máximo 200 caracteres'

  for (const [campo, opciones] of Object.entries(OPCIONES_NEGOCIO)) {
    const valor = (valores[campo] ?? '').trim()
    if (!valor) errores[campo] = 'Elige una opción'
    else if (!opciones.includes(valor)) errores[campo] = 'Opción no válida'
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('solicitudes_sitio')
    .update({
      empresa,
      giro,
      sitio_actual: (valores.sitio_actual ?? '').trim() || null,
      facturacion: valores.facturacion,
      es_dueno: valores.es_dueno,
      paso: 2,
      actualizado_at: new Date().toISOString(),
    })
    // El token es lo que impide completar la solicitud de otra persona.
    .eq('id', cred.id)
    .eq('token', cred.token)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al guardar el negocio:', error)
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }
  }

  return { ok: true, id: cred.id, token: cred.token }
}

// ──────────────────── paso 3 · el proyecto y el cierre ────────────────────

const CAMPOS_PROYECTO = ['problema', 'presupuesto', 'arranque']

const OPCIONES_PROYECTO: Record<string, readonly string[]> = {
  presupuesto: PRESUPUESTO,
  arranque: ARRANQUE,
}

/**
 * Paso 3: cierra la solicitud y avisa al equipo por correo.
 *
 * Un fallo de correo nunca pierde la solicitud: para cuando llegamos aquí
 * ya está escrita en la base desde el paso 1.
 */
export async function agendarSolicitud(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const valores = valoresDe(formData, CAMPOS_PROYECTO)
  const errores: Record<string, string> = {}

  if (esBot(formData))
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }

  const cred = credenciales(formData)
  if (!cred)
    return {
      ok: false,
      errores: { _form: 'Se perdió tu sesión. Vuelve a empezar, por favor.' },
      valores,
    }

  const problema = (valores.problema ?? '').trim()
  if (!problema) errores.problema = 'Cuéntanos qué está pasando'
  else if (problema.length > 2000) errores.problema = 'Máximo 2000 caracteres'

  for (const [campo, opciones] of Object.entries(OPCIONES_PROYECTO)) {
    const valor = (valores[campo] ?? '').trim()
    if (!valor) errores[campo] = 'Elige una opción'
    else if (!opciones.includes(valor)) errores[campo] = 'Opción no válida'
  }

  const servicios = formData
    .getAll('servicios')
    .filter((v): v is string => typeof v === 'string' && SLUGS.has(v))
  if (servicios.length === 0)
    errores.servicios = 'Elige al menos un servicio que te interese'

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('solicitudes_sitio')
    .update({
      servicios,
      problema,
      presupuesto: valores.presupuesto,
      arranque: valores.arranque,
      paso: 3,
      actualizado_at: new Date().toISOString(),
    })
    .eq('id', cred.id)
    .eq('token', cred.token)
    .select(
      'nombre, apellido, email, telefono, empresa, giro, sitio_actual, facturacion, es_dueno'
    )
    .maybeSingle()

  if (error || !data) {
    console.error('Error al cerrar la solicitud:', error)
    return { ok: false, errores: { _form: FALLA_GUARDADO }, valores }
  }

  const nombresServicios = servicios
    .map((slug) => SERVICIOS.find((s) => s.slug === slug)?.etiqueta ?? slug)
    .join(', ')
  const quien = `${data.nombre} ${data.apellido ?? ''}`.trim()

  await enviarEmail(
    'equipo@topdigital.company',
    `Nueva solicitud de diagnóstico — ${escapar(data.empresa ?? quien)}`,
    `<h2>Nueva solicitud desde el sitio</h2>
     <p><strong>${escapar(quien)}</strong> — ${escapar(data.empresa ?? '—')} (${escapar(data.giro ?? '—')})</p>
     <ul>
       <li>WhatsApp: ${escapar(data.telefono ?? '')}</li>
       <li>Correo: ${escapar(data.email ?? '')}</li>
       <li>Sitio o redes: ${escapar(data.sitio_actual || '—')}</li>
       <li>Facturación: ${escapar(data.facturacion ?? '')}</li>
       <li>¿Es dueño?: ${escapar(data.es_dueno ?? '')}</li>
       <li>Servicios de interés: ${escapar(nombresServicios)}</li>
       <li>Presupuesto: ${escapar(valores.presupuesto ?? '')}</li>
       <li>Quiere arrancar: ${escapar(valores.arranque ?? '')}</li>
     </ul>
     <p><strong>Lo que nos contó:</strong><br>${escapar(problema).replace(/\n/g, '<br>')}</p>`
  )

  return { ok: true }
}

/** Alta al newsletter desde el pie del sitio. */
export async function suscribir(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (esBot(formData)) return { ok: true }

  const email = ((formData.get('email') as string) ?? '').trim()
  if (!EMAIL.test(email)) {
    return {
      ok: false,
      errores: { email: 'Escribe un correo válido' },
      valores: { email },
    }
  }

  const supabase = createAdminClient()
  // Ya suscrito: no es un error para quien lo intenta de nuevo.
  const { error } = await supabase
    .from('suscriptores_sitio')
    .upsert({ email, origen: 'sitio-footer' }, { onConflict: 'email' })

  if (error) {
    console.error('Error al suscribir:', error)
    return {
      ok: false,
      errores: { email: 'No pudimos registrarte, inténtalo de nuevo' },
      valores: { email },
    }
  }

  return { ok: true }
}
