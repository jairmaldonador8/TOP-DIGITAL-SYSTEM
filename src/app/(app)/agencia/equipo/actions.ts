'use server'

import { revalidatePath } from 'next/cache'

import {
  esAdmin,
  esUuid,
  NO_AUTORIZADO,
  valoresDe,
  type ResultadoAccion,
} from '@/lib/acciones'
import { validarUsuarioCliente } from '@/lib/clientes/validacion'
import {
  PRIORIDADES_ENCARGO,
  puedeTransicionar,
  type EstadoEncargo,
  type PrioridadEncargo,
} from '@/lib/equipo/transiciones'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function revalidarEquipo() {
  revalidatePath('/agencia/equipo')
  revalidatePath('/equipo', 'layout')
  revalidatePath('/agencia', 'layout')
}

/**
 * Alta de un integrante del equipo (rol 'equipo'): mismo flujo que
 * crearUsuarioCliente — auth con cliente admin, fila con cliente normal,
 * limpieza del huérfano si la fila falla.
 */
export async function crearTrabajador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, ['nombre', 'puesto', 'email'])
  const resultado = validarUsuarioCliente({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  const puesto = ((formData.get('puesto') as string) ?? '').trim()
  const errores = resultado.ok ? {} : { ...resultado.errores }
  if (!puesto) errores.puesto = 'Indica el puesto (Diseño, Video...)'
  if (!resultado.ok || Object.keys(errores).length > 0) {
    return { ok: false, errores, valores }
  }

  const admin = createAdminClient()
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: resultado.datos.email,
    password: resultado.datos.password,
    email_confirm: true,
  })

  if (errorAuth || !creado?.user) {
    if (errorAuth?.code === 'email_exists') {
      return {
        ok: false,
        errores: { email: 'Este correo ya está registrado en el sistema' },
        valores,
      }
    }
    console.error('Error al crear usuario de auth (equipo):', errorAuth)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear la cuenta, intenta de nuevo' },
      valores,
    }
  }

  const supabase = await createClient()
  const { error: errorFila } = await supabase.from('usuarios').insert({
    user_id: creado.user.id,
    cliente_id: null,
    rol: 'equipo',
    nombre: resultado.datos.nombre,
    puesto,
  })

  if (errorFila) {
    console.error('Error al insertar integrante, limpiando auth:', errorFila)
    const { error: errorLimpieza } = await admin.auth.admin.deleteUser(
      creado.user.id
    )
    if (errorLimpieza) {
      console.error(
        `Usuario de auth huérfano ${creado.user.id}: no se pudo eliminar:`,
        errorLimpieza
      )
    }
    return {
      ok: false,
      errores: { _form: 'No se pudo crear la cuenta, intenta de nuevo' },
      valores,
    }
  }

  revalidarEquipo()
  return { ok: true, email: resultado.datos.email }
}

/** Crea un encargo para un integrante del equipo. */
export async function crearEncargo(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, [
    'asignado_a',
    'cliente_id',
    'titulo',
    'descripcion',
    'prioridad',
    'fecha_limite',
  ])
  const errores: Record<string, string> = {}

  const titulo = (valores.titulo ?? '').trim()
  if (!titulo) errores.titulo = 'Ponle título al encargo'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  if (!esUuid(valores.asignado_a ?? '')) {
    errores.asignado_a = 'Elige a quién se lo asignas'
  }

  const clienteId = (valores.cliente_id ?? '').trim()
  if (clienteId && !esUuid(clienteId)) {
    errores.cliente_id = 'Cliente no válido'
  }

  const prioridad = (valores.prioridad ?? 'media') as PrioridadEncargo
  if (!PRIORIDADES_ENCARGO.includes(prioridad)) {
    errores.prioridad = 'Prioridad no válida'
  }

  const fecha = (valores.fecha_limite ?? '').trim()
  if (fecha && !FECHA.test(fecha)) errores.fecha_limite = 'Fecha no válida'

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = await createClient()

  // El asignado debe ser un integrante del equipo real.
  const { data: integrante } = await supabase
    .from('usuarios')
    .select('user_id')
    .eq('user_id', valores.asignado_a)
    .eq('rol', 'equipo')
    .maybeSingle()
  if (!integrante) {
    return {
      ok: false,
      errores: { asignado_a: 'Ese integrante no existe' },
      valores,
    }
  }

  const { error } = await supabase.from('encargos').insert({
    asignado_a: valores.asignado_a,
    cliente_id: clienteId || null,
    titulo,
    descripcion: (valores.descripcion ?? '').trim() || null,
    prioridad,
    fecha_limite: fecha || null,
  })

  if (error) {
    console.error('Error al crear encargo:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear el encargo, intenta de nuevo' },
      valores,
    }
  }

  revalidarEquipo()
  return { ok: true }
}

export type ResultadoRevision = { ok: true } | { ok: false; mensaje: string }

/**
 * Revisión del dueño sobre un encargo entregado: aprobar (terminal) o
 * pedir cambios con comentario obligatorio.
 */
export async function revisarEncargo(
  encargoId: string,
  veredicto: 'aprobado' | 'cambios',
  comentario?: string
): Promise<ResultadoRevision> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!esUuid(encargoId) || (veredicto !== 'aprobado' && veredicto !== 'cambios')) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }
  const nota = (comentario ?? '').trim()
  if (veredicto === 'cambios' && !nota) {
    return { ok: false, mensaje: 'Escribe qué cambios necesita' }
  }

  const supabase = await createClient()
  const { data: encargo } = await supabase
    .from('encargos')
    .select('id, estado')
    .eq('id', encargoId)
    .maybeSingle()
  if (!encargo) return { ok: false, mensaje: 'El encargo no existe' }

  if (!puedeTransicionar('admin', encargo.estado as EstadoEncargo, veredicto)) {
    return { ok: false, mensaje: 'Este encargo no está esperando revisión' }
  }

  const { error } = await supabase
    .from('encargos')
    .update(
      veredicto === 'aprobado'
        ? {
            estado: 'aprobado',
            aprobado_en: new Date().toISOString(),
            comentario_revision: nota || null,
          }
        : { estado: 'cambios', comentario_revision: nota }
    )
    .eq('id', encargoId)

  if (error) {
    console.error('Error al revisar encargo:', error)
    return { ok: false, mensaje: 'No se pudo guardar la revisión' }
  }

  revalidarEquipo()
  return { ok: true }
}
