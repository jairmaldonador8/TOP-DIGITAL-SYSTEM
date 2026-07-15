'use server'

import { revalidatePath } from 'next/cache'

import { usuarioActual } from '@/lib/auth/usuario-actual'
import {
  validarCliente,
  validarUsuarioCliente,
} from '@/lib/clientes/validacion'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Resultado estándar de las acciones de formulario: en caso de error se
 * devuelven los valores capturados para repoblar el formulario (React 19
 * resetea los <form> después de cada action).
 */
export type ResultadoAccion =
  | { ok: true; email?: string }
  | { ok: false; errores: Record<string, string>; valores: Record<string, string> }
  | null

const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  errores: { _form: 'No tienes permiso para realizar esta acción' },
  valores: {},
}

/** Los Server Actions nunca confían en la UI: re-verifican el rol admin. */
async function esAdmin(): Promise<boolean> {
  const actual = await usuarioActual()
  return actual.rol === 'admin'
}

function valoresDe(formData: FormData, campos: string[]): Record<string, string> {
  const valores: Record<string, string> = {}
  for (const campo of campos) {
    const valor = formData.get(campo)
    if (typeof valor === 'string') valores[campo] = valor
  }
  return valores
}

const CAMPOS_CLIENTE = [
  'nombre_negocio',
  'contacto_nombre',
  'email',
  'telefono',
  'presupuesto_ads',
  'meta_facturacion',
  'notas',
]

export async function crearCliente(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, CAMPOS_CLIENTE)
  const resultado = validarCliente(valores)
  if (!resultado.ok) {
    return { ok: false, errores: resultado.errores, valores }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('clientes').insert(resultado.datos)

  if (error) {
    console.error('Error al crear cliente:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo guardar el cliente, intenta de nuevo' },
      valores,
    }
  }

  revalidatePath('/agencia/clientes')
  return { ok: true }
}

export async function actualizarCliente(
  clienteId: string,
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, CAMPOS_CLIENTE)
  const resultado = validarCliente(valores)
  if (!resultado.ok) {
    return { ok: false, errores: resultado.errores, valores }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .update(resultado.datos)
    .eq('id', clienteId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al actualizar cliente:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo actualizar el cliente, intenta de nuevo' },
      valores,
    }
  }

  revalidatePath('/agencia/clientes')
  revalidatePath(`/agencia/clientes/${clienteId}`)
  return { ok: true }
}

export type ResultadoEstado = { ok: true } | { ok: false; mensaje: string }

/**
 * Desactiva o reactiva un cliente. Los clientes NUNCA se borran: solo
 * cambian de estado para conservar su historial de leads y campañas.
 */
export async function cambiarEstadoCliente(
  clienteId: string,
  estado: 'activo' | 'inactivo'
): Promise<ResultadoEstado> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (estado !== 'activo' && estado !== 'inactivo') {
    return { ok: false, mensaje: 'Estado no válido' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .update({ estado })
    .eq('id', clienteId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al cambiar estado del cliente:', error)
    return { ok: false, mensaje: 'No se pudo cambiar el estado, intenta de nuevo' }
  }

  revalidatePath('/agencia/clientes')
  revalidatePath(`/agencia/clientes/${clienteId}`)
  return { ok: true }
}

/**
 * Crea un usuario de portal (rol 'cliente') para un cliente existente:
 * 1. Verifica que el cliente exista (el id nunca se toma de campos ocultos
 *    sin validar).
 * 2. Crea el usuario de auth con el cliente ADMIN (auth.admin API).
 * 3. Inserta la fila en usuarios con el cliente NORMAL (RLS de admin).
 *    Si esa inserción falla, elimina el usuario de auth para no dejar
 *    huérfanos.
 */
export async function crearUsuarioCliente(
  clienteId: string,
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, ['nombre', 'email'])
  const resultado = validarUsuarioCliente({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!resultado.ok) {
    return { ok: false, errores: resultado.errores, valores }
  }

  const supabase = await createClient()
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .maybeSingle()

  if (!cliente) {
    return {
      ok: false,
      errores: { _form: 'El cliente no existe o fue eliminado' },
      valores,
    }
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
    console.error('Error al crear usuario de auth:', errorAuth)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear el usuario, intenta de nuevo' },
      valores,
    }
  }

  const { error: errorFila } = await supabase.from('usuarios').insert({
    user_id: creado.user.id,
    cliente_id: cliente.id,
    rol: 'cliente',
    nombre: resultado.datos.nombre,
  })

  if (errorFila) {
    console.error('Error al insertar fila de usuario, limpiando auth:', errorFila)
    // Limpieza: sin fila en usuarios el login quedaría huérfano.
    await admin.auth.admin.deleteUser(creado.user.id)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear el usuario, intenta de nuevo' },
      valores,
    }
  }

  revalidatePath(`/agencia/clientes/${clienteId}`)
  return { ok: true, email: resultado.datos.email }
}
