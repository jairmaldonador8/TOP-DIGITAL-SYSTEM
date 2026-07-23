'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin, esUuid } from '@/lib/acciones'
import { obtenerTodos } from '@/lib/meta/client'
import type { CuentaMeta } from '@/lib/meta/tipos'
import { createClient } from '@/lib/supabase/server'

const CUENTA_META = /^act_\d+$/

export type ResultadoCuentas =
  | {
      ok: true
      cuentas: { id: string; nombre: string; numero: string; activa: boolean }[]
    }
  | { ok: false; mensaje: string }

/** Lista las cuentas publicitarias asignadas al usuario de sistema. */
export async function listarCuentasMeta(): Promise<ResultadoCuentas> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  try {
    const cuentas = await obtenerTodos<CuentaMeta>('/me/adaccounts', {
      fields: 'id,name,account_id,account_status',
    })
    return {
      ok: true,
      cuentas: cuentas.map((c) => ({
        id: c.id,
        nombre: c.name,
        numero: c.account_id,
        activa: c.account_status === 1,
      })),
    }
  } catch (error) {
    console.error('Error al listar cuentas de Meta:', error)
    return {
      ok: false,
      mensaje: 'No se pudieron cargar las cuentas de Meta; revisa la conexión',
    }
  }
}

export type ResultadoVinculo = { ok: true } | { ok: false; mensaje: string }

/** Vincula (o desvincula con null) la cuenta publicitaria de un cliente. */
export async function vincularCuentaMeta(
  clienteId: string,
  cuentaId: string | null
): Promise<ResultadoVinculo> {
  if (!(await esAdmin())) {
    return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  }
  if (!esUuid(clienteId) || (cuentaId !== null && !CUENTA_META.test(cuentaId))) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }

  const supabase = await createClient()
  // Al desvincular (cuentaId null), las campañas ya sincronizadas se
  // conservan y solo dejan de actualizarse (decisión de spec, no se borran).
  const { data, error } = await supabase
    .from('clientes')
    .update({ meta_ad_account_id: cuentaId })
    .eq('id', clienteId)
    .select('id')
    .maybeSingle()

  if (error?.code === '23505') {
    return { ok: false, mensaje: 'Esa cuenta de Meta ya está vinculada a otro cliente' }
  }
  if (error || !data) {
    console.error('Error al vincular cuenta Meta:', error)
    return { ok: false, mensaje: 'No se pudo guardar el vínculo, intenta de nuevo' }
  }

  revalidatePath('/agencia/clientes')
  revalidatePath(`/agencia/clientes/${clienteId}`)
  return { ok: true }
}
