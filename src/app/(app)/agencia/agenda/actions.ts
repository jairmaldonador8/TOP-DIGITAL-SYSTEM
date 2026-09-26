'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin, esUuid, NO_AUTORIZADO, valoresDe, type ResultadoAccion } from '@/lib/acciones'
import { validarCita, validarPendiente } from '@/lib/agenda/cita'
import { createClient } from '@/lib/supabase/server'

const CAMPOS_CITA = ['titulo', 'fecha', 'hora', 'hora_fin', 'lugar', 'aviso_min', 'cliente_id', 'descripcion', 'tipo']
const CAMPOS_PENDIENTE = ['titulo', 'fecha_limite', 'hora', 'cliente_id']

function revalidar() {
  // Mi día, calendario, campanita y feed leen citas/pendientes.
  revalidatePath('/agencia', 'layout')
}

export async function crearCita(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const valores = valoresDe(formData, CAMPOS_CITA)
  const r = validarCita(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('eventos').insert(r.datos)
  if (error) {
    console.error('Error al crear cita:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar la cita, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}

export async function editarCita(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const id = String(formData.get('id') ?? '')
  const valores = valoresDe(formData, CAMPOS_CITA)
  if (!esUuid(id)) return { ok: false, errores: { _form: 'Solicitud no válida' }, valores }
  const r = validarCita(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos')
    .update(r.datos)
    .eq('id', id)
    .is('borrado_en', null)
    .select('id')
    .maybeSingle()
  if (error || !data) {
    console.error('Error al editar cita:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar el cambio, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}

export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string }

/**
 * Borra una cita. Si ya vive en Google (google_event_id), es borrado suave:
 * la fase 3 la quita de Google y luego la elimina. Si no, se va de una vez.
 */
export async function eliminarCita(id: string): Promise<ResultadoSimple> {
  if (!(await esAdmin())) return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  if (!esUuid(id)) return { ok: false, mensaje: 'Solicitud no válida' }

  const supabase = await createClient()
  const { data: fila } = await supabase.from('eventos').select('google_event_id').eq('id', id).maybeSingle()
  const { error } = fila?.google_event_id
    ? await supabase.from('eventos').update({ borrado_en: new Date().toISOString(), google_pendiente: true }).eq('id', id)
    : await supabase.from('eventos').delete().eq('id', id)
  if (error) {
    console.error('Error al eliminar cita:', error)
    return { ok: false, mensaje: 'No se pudo eliminar, intenta de nuevo' }
  }
  revalidar()
  return { ok: true }
}

export async function crearPendiente(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const valores = valoresDe(formData, CAMPOS_PENDIENTE)
  const r = validarPendiente(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('tareas').insert(r.datos)
  if (error) {
    console.error('Error al crear pendiente:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar el pendiente, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}
