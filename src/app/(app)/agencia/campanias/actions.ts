'use server'

import { revalidatePath } from 'next/cache'

import {
  esAdmin,
  NO_AUTORIZADO,
  valoresDe,
  type ResultadoAccion,
} from '@/lib/acciones'
import { createClient } from '@/lib/supabase/server'

const CAMPOS_CAMPANIA = [
  'nombre',
  'cliente_id',
  'plataforma',
  'fecha_inicio',
  'presupuesto',
]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Abre (crea) una campaña: nace activa y con su fila de finanzas. */
export async function crearCampania(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO

  const valores = valoresDe(formData, CAMPOS_CAMPANIA)
  const errores: Record<string, string> = {}

  const nombre = (valores.nombre ?? '').trim()
  if (!nombre) errores.nombre = 'Ponle nombre a la campaña'
  else if (nombre.length > 200) errores.nombre = 'Máximo 200 caracteres'

  const clienteId = valores.cliente_id ?? ''
  if (!UUID.test(clienteId)) errores.cliente_id = 'Elige de qué cliente es'

  const fecha = (valores.fecha_inicio ?? '').trim()
  if (fecha && !FECHA.test(fecha)) errores.fecha_inicio = 'Fecha no válida'

  const presupuestoTexto = (valores.presupuesto ?? '').trim()
  const presupuesto = presupuestoTexto === '' ? 0 : Number(presupuestoTexto)
  if (!Number.isFinite(presupuesto) || presupuesto < 0) {
    errores.presupuesto = 'Debe ser una cantidad válida'
  }

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

  const { data: campania, error } = await supabase
    .from('campanias')
    .insert({
      cliente_id: cliente.id,
      nombre,
      plataforma: (valores.plataforma ?? '').trim() || null,
      fecha_inicio: fecha || null,
      estado: 'activa',
    })
    .select('id')
    .single()

  if (error || !campania) {
    console.error('Error al crear campaña:', error)
    return {
      ok: false,
      errores: { _form: 'No se pudo crear la campaña, intenta de nuevo' },
      valores,
    }
  }

  // La fila de finanzas registra el gasto (sensible: RLS solo-admin). Si
  // fallara, la campaña sobrevive y el gasto se muestra como «—».
  const { error: errorFinanzas } = await supabase
    .from('campania_finanzas')
    .insert({
      campania_id: campania.id,
      cliente_id: cliente.id,
      gasto: presupuesto,
    })
  if (errorFinanzas) {
    console.error('Error al crear finanzas de campaña:', errorFinanzas)
  }

  revalidatePath('/agencia', 'layout')
  return { ok: true }
}

export type ResultadoCampania = { ok: true } | { ok: false; mensaje: string }

const ESTADOS_CAMPANIA = ['activa', 'pausada', 'archivada'] as const
export type EstadoCampania = (typeof ESTADOS_CAMPANIA)[number]

/**
 * Cambia el estado de una campaña: pausar/reanudar, archivar (sale del
 * tablero y del portal del cliente) o restaurar desde Archivadas.
 */
export async function cambiarEstadoCampania(
  campaniaId: string,
  estado: EstadoCampania
): Promise<ResultadoCampania> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!ESTADOS_CAMPANIA.includes(estado) || !UUID.test(campaniaId)) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campanias')
    .update({ estado })
    .eq('id', campaniaId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al cambiar estado de campaña:', error)
    return { ok: false, mensaje: 'No se pudo guardar el cambio, intenta de nuevo' }
  }

  revalidatePath('/agencia', 'layout')
  return { ok: true }
}
