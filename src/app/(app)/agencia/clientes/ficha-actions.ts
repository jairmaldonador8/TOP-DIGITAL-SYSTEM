'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin, esUuid, NO_AUTORIZADO, type ResultadoAccion } from '@/lib/acciones'
import { leerCuota, leerKit } from '@/lib/clientes/ficha'
import { esPuesto, PUESTOS } from '@/lib/equipo/puestos'
import { createClient } from '@/lib/supabase/server'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function revalidarFicha(id: string) {
  revalidatePath(`/agencia/clientes/${id}`)
  revalidatePath('/agencia/clientes')
}

/** Datos de operación: arranque, cobro, paquete, cuota y revisión de producción. */
export async function guardarOperacion(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const valores = Object.fromEntries(
    [...fd.entries()].filter(([, v]) => typeof v === 'string')
  ) as Record<string, string>
  const errores: Record<string, string> = {}

  const arranque = (valores.fecha_arranque ?? '').trim()
  if (arranque && !FECHA.test(arranque)) errores.fecha_arranque = 'Fecha inválida'
  const cobroTxt = (valores.dia_cobro ?? '').trim()
  const cobro = cobroTxt === '' ? null : Number(cobroTxt)
  if (cobro !== null && !(Number.isInteger(cobro) && cobro >= 1 && cobro <= 31)) {
    errores.dia_cobro = 'Un día del 1 al 31'
  }
  const cuota = leerCuota(fd)
  if (!cuota.ok) Object.assign(errores, cuota.errores)
  if (Object.keys(errores).length || !cuota.ok) return { ok: false, errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update({
    fecha_arranque: arranque || null,
    dia_cobro: cobro,
    paquete: (valores.paquete ?? '').trim() || null,
    cuota: cuota.cuota,
    produccion_requiere_revision: fd.get('produccion_requiere_revision') === 'on',
  }).eq('id', clienteId)
  if (error) {
    console.error('guardarOperacion:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar' }, valores }
  }
  revalidarFicha(clienteId)
  return { ok: true }
}

export async function guardarKit(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const supabase = await createClient()
  const { error } = await supabase.from('clientes')
    .update({ kit_marca: leerKit(fd) }).eq('id', clienteId)
  if (error) {
    console.error('guardarKit:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar' }, valores: {} }
  }
  revalidarFicha(clienteId)
  return { ok: true }
}

/** Un responsable por puesto. Campo vacío = quitar al responsable de ese puesto. */
export async function guardarEquipoCliente(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const supabase = await createClient()
  const errores: Record<string, string> = {}

  for (const puesto of PUESTOS) {
    if (!esPuesto(puesto)) continue
    const uid = String(fd.get(`equipo_${puesto}`) ?? '').trim()
    if (uid === '') {
      const { error } = await supabase.from('cliente_equipo').delete()
        .eq('cliente_id', clienteId).eq('puesto', puesto)
      if (error) errores[`equipo_${puesto}`] = 'No se pudo quitar'
      continue
    }
    if (!esUuid(uid)) { errores[`equipo_${puesto}`] = 'Integrante inválido'; continue }
    const { error } = await supabase.from('cliente_equipo').upsert(
      { cliente_id: clienteId, user_id: uid, puesto },
      { onConflict: 'cliente_id,puesto' }
    )
    if (error) errores[`equipo_${puesto}`] = 'Ese integrante no tiene este puesto'
  }
  if (Object.keys(errores).length) return { ok: false, errores, valores: {} }
  revalidarFicha(clienteId)
  revalidatePath('/equipo', 'layout')
  return { ok: true }
}
