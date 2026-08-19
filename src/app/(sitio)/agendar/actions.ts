'use server'

import { valoresDe, type ResultadoAccion } from '@/lib/acciones'
import { enviarEmail } from '@/lib/email/email-server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ARRANQUE,
  FACTURACION,
  PRESUPUESTO,
  SI_NO,
} from '@/lib/sitio/formulario'
import { SERVICIOS } from '@/lib/sitio/servicios'

const CAMPOS = [
  'nombre',
  'email',
  'telefono',
  'empresa',
  'sitio_actual',
  'giro',
  'facturacion',
  'es_dueno',
  'problema',
  'presupuesto',
  'arranque',
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** 10 dígitos (nacional) o hasta 15 con lada internacional. */
const TELEFONO = /^\+?[\d\s()-]{10,20}$/

const OPCIONES: Record<string, readonly string[]> = {
  facturacion: FACTURACION,
  es_dueno: SI_NO,
  presupuesto: PRESUPUESTO,
  arranque: ARRANQUE,
}

const SLUGS = new Set(SERVICIOS.map((s) => s.slug))

function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Alta de una solicitud de videollamada desde el sitio público.
 *
 * Es una acción SIN sesión, así que no confía en nada: valida cada campo,
 * acota los selects a sus opciones y escribe con el cliente admin (la
 * tabla no tiene policy de insert para anónimos). Avisa por correo al
 * equipo, pero un fallo de correo nunca pierde la solicitud.
 */
export async function enviarSolicitud(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const valores = valoresDe(formData, CAMPOS)
  const errores: Record<string, string> = {}

  // Trampa antispam: campo oculto que una persona nunca llena. Si viene
  // con texto, respondemos ok sin guardar para no darle señal al bot.
  if ((formData.get('sitio_web') as string)?.trim()) return { ok: true }

  const nombre = (valores.nombre ?? '').trim()
  if (!nombre) errores.nombre = 'Escribe tu nombre'
  else if (nombre.length > 120) errores.nombre = 'Máximo 120 caracteres'

  const email = (valores.email ?? '').trim()
  if (!email) errores.email = 'Escribe tu correo'
  else if (!EMAIL.test(email)) errores.email = 'Ese correo no parece válido'

  const telefono = (valores.telefono ?? '').trim()
  if (!telefono) errores.telefono = 'Escribe tu WhatsApp'
  else if (!TELEFONO.test(telefono))
    errores.telefono = 'Escribe 10 dígitos, con lada si es del extranjero'

  const empresa = (valores.empresa ?? '').trim()
  if (!empresa) errores.empresa = 'Escribe el nombre de tu empresa'

  const giro = (valores.giro ?? '').trim()
  if (!giro) errores.giro = 'Cuéntanos a qué se dedica'

  const problema = (valores.problema ?? '').trim()
  if (!problema) errores.problema = 'Cuéntanos qué está pasando'
  else if (problema.length > 2000) errores.problema = 'Máximo 2000 caracteres'

  for (const [campo, opciones] of Object.entries(OPCIONES)) {
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
  const { error } = await supabase.from('solicitudes_sitio').insert({
    nombre,
    email,
    telefono,
    empresa,
    sitio_actual: (valores.sitio_actual ?? '').trim() || null,
    giro,
    facturacion: valores.facturacion,
    es_dueno: valores.es_dueno,
    servicios,
    problema,
    presupuesto: valores.presupuesto,
    arranque: valores.arranque,
    origen: 'sitio-agendar',
  })

  if (error) {
    console.error('Error al guardar solicitud del sitio:', error)
    return {
      ok: false,
      errores: {
        _form:
          'No pudimos registrar tu solicitud. Escríbenos por WhatsApp y lo resolvemos al momento.',
      },
      valores,
    }
  }

  const nombresServicios = servicios
    .map((slug) => SERVICIOS.find((s) => s.slug === slug)?.etiqueta ?? slug)
    .join(', ')

  await enviarEmail(
    'equipo@topdigital.company',
    `Nueva solicitud de diagnóstico — ${escapar(empresa)}`,
    `<h2>Nueva solicitud desde el sitio</h2>
     <p><strong>${escapar(nombre)}</strong> — ${escapar(empresa)} (${escapar(giro)})</p>
     <ul>
       <li>WhatsApp: ${escapar(telefono)}</li>
       <li>Correo: ${escapar(email)}</li>
       <li>Sitio o redes: ${escapar((valores.sitio_actual ?? '').trim() || '—')}</li>
       <li>Facturación: ${escapar(valores.facturacion ?? '')}</li>
       <li>¿Es dueño?: ${escapar(valores.es_dueno ?? '')}</li>
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
  if ((formData.get('sitio_web') as string)?.trim()) return { ok: true }

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
