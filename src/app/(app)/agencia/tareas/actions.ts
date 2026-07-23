'use server'

import { revalidatePath } from 'next/cache'

import {
  esAdmin,
  esUuid,
  NO_AUTORIZADO,
  valoresDe,
  type ResultadoAccion,
} from '@/lib/acciones'
import { createClient } from '@/lib/supabase/server'

const CAMPOS_TAREA = ['titulo', 'descripcion', 'cliente_id', 'fecha_limite']

const FECHA = /^\d{4}-\d{2}-\d{2}$/

export async function crearTarea(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, CAMPOS_TAREA)
  const errores: Record<string, string> = {}

  const titulo = (valores.titulo ?? '').trim()
  if (!titulo) errores.titulo = 'Escribe un título para la tarea'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const clienteId = valores.cliente_id ?? ''
  if (!esUuid(clienteId)) errores.cliente_id = 'Elige a qué cliente pertenece'

  const fecha = (valores.fecha_limite ?? '').trim()
  if (fecha && !FECHA.test(fecha)) errores.fecha_limite = 'Fecha no válida'

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = await createClient()
  // El id del cliente viene de un control de la UI, pero no se confía en él.
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .maybeSingle()

  if (!cliente) {
    return {
      ok: false,
      errores: { cliente_id: 'El cliente no existe o fue eliminado' },
      valores,
    }
  }

  const { error } = await supabase.from('tareas').insert({
    cliente_id: cliente.id,
    titulo,
    descripcion: (valores.descripcion ?? '').trim() || null,
    fecha_limite: fecha || null,
  })

  if (error) {
    console.error('Error al crear tarea:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear la tarea, intenta de nuevo' },
      valores,
    }
  }

  // Layout completo: el dashboard y la campanita también cuentan tareas.
  revalidatePath('/agencia', 'layout')
  return { ok: true }
}

export type ResultadoTarea = { ok: true } | { ok: false; mensaje: string }

const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'completada'] as const
export type EstadoTarea = (typeof ESTADOS_TAREA)[number]

/**
 * Cambia el estado de una tarea: completar la archiva, regresarla a
 * pendiente la restaura (también es el "Deshacer" del toast).
 */
export async function cambiarEstadoTarea(
  tareaId: string,
  estado: EstadoTarea
): Promise<ResultadoTarea> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!ESTADOS_TAREA.includes(estado) || !esUuid(tareaId)) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tareas')
    .update({ estado })
    .eq('id', tareaId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al cambiar estado de tarea:', error)
    return { ok: false, mensaje: 'No se pudo guardar el cambio, intenta de nuevo' }
  }

  revalidatePath('/agencia', 'layout')
  return { ok: true }
}
