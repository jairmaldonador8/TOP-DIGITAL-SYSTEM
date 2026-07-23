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

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const HORA = /^\d{2}:\d{2}$/
const TIPOS_EVENTO = ['junta', 'sesion', 'lanzamiento', 'pago', 'otro'] as const

/** Crea un evento manual del calendario de operación. */
export async function crearEvento(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, [
    'titulo',
    'descripcion',
    'cliente_id',
    'fecha',
    'hora',
    'tipo',
  ])
  const errores: Record<string, string> = {}

  const titulo = (valores.titulo ?? '').trim()
  if (!titulo) errores.titulo = 'Ponle título al evento'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const fecha = (valores.fecha ?? '').trim()
  if (!FECHA.test(fecha)) errores.fecha = 'Elige la fecha'

  const hora = (valores.hora ?? '').trim()
  if (hora && !HORA.test(hora)) errores.hora = 'Hora no válida'

  const tipo = (valores.tipo ?? 'otro') as (typeof TIPOS_EVENTO)[number]
  if (!TIPOS_EVENTO.includes(tipo)) errores.tipo = 'Tipo no válido'

  const clienteId = (valores.cliente_id ?? '').trim()
  if (clienteId && !esUuid(clienteId)) errores.cliente_id = 'Cliente no válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('eventos').insert({
    titulo,
    descripcion: (valores.descripcion ?? '').trim() || null,
    cliente_id: clienteId || null,
    fecha,
    hora: hora || null,
    tipo,
  })

  if (error) {
    console.error('Error al crear evento:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo guardar el evento, intenta de nuevo' },
      valores,
    }
  }

  revalidatePath('/agencia/calendario')
  return { ok: true }
}

export type ResultadoEvento = { ok: true } | { ok: false; mensaje: string }

/** Elimina un evento manual (v1: editar = eliminar y recrear). */
export async function eliminarEvento(id: string): Promise<ResultadoEvento> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!esUuid(id)) return { ok: false, mensaje: 'Solicitud no válida' }

  const supabase = await createClient()
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) {
    console.error('Error al eliminar evento:', error)
    return { ok: false, mensaje: 'No se pudo eliminar, intenta de nuevo' }
  }

  revalidatePath('/agencia/calendario')
  return { ok: true }
}
