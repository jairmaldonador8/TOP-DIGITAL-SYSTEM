'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin } from '@/lib/acciones'
import { obtenerTodos } from '@/lib/meta/client'
import type { CuentaMeta } from '@/lib/meta/tipos'
import { createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUENTA_META = /^act_\d+$/

export type ResultadoCuentas =
  | { ok: true; cuentas: { id: string; nombre: string; numero: string }[] }
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
  if (!UUID.test(clienteId) || (cuentaId !== null && !CUENTA_META.test(cuentaId))) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .update({ meta_ad_account_id: cuentaId })
    .eq('id', clienteId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Error al vincular cuenta Meta:', error)
    return { ok: false, mensaje: 'No se pudo guardar el vínculo, intenta de nuevo' }
  }

  revalidatePath('/agencia', 'layout')
  return { ok: true }
}
