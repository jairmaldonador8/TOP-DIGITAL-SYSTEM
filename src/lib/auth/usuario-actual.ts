import { cache } from 'react'

import {
  rolDesdeClaims,
  type ClaimsConRol,
  type Rol,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

/** Fila de usuarios con el join opcional al negocio del cliente. */
type FilaUsuario = {
  nombre: string
  cliente_id: string | null
  intro_vista: boolean
  clientes:
    | { nombre_negocio: string }
    | { nombre_negocio: string }[]
    | null
}

export type UsuarioActual = {
  claims: ClaimsConRol | null
  rol: Rol | null
  /** Nombre de la persona (fila en usuarios), null si no hay sesión o fila. */
  nombre: string | null
  clienteId: string | null
  /** nombre_negocio del cliente al que pertenece (solo rol cliente). */
  negocio: string | null
  /** true si ya vio el tour de bienvenida (true también sin fila: no mostrar). */
  introVista: boolean
}

const SIN_SESION: UsuarioActual = {
  claims: null,
  rol: null,
  nombre: null,
  clienteId: null,
  negocio: null,
  introVista: true,
}

/**
 * Usuario de la sesión actual (claims + fila de usuarios), memoizado por
 * request con React cache(): layout y page comparten UNA sola consulta.
 */
export const usuarioActual = cache(async (): Promise<UsuarioActual> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = (data?.claims ?? null) as ClaimsConRol | null
  const sub = typeof claims?.sub === 'string' ? claims.sub : null
  if (!claims || !sub) return SIN_SESION

  const { data: fila } = await supabase
    .from('usuarios')
    .select('nombre, cliente_id, intro_vista, clientes ( nombre_negocio )')
    .eq('user_id', sub)
    .maybeSingle()

  const usuario = fila as FilaUsuario | null
  const relacion = usuario?.clientes
  const negocio = Array.isArray(relacion)
    ? (relacion[0]?.nombre_negocio ?? null)
    : (relacion?.nombre_negocio ?? null)

  return {
    claims,
    rol: rolDesdeClaims(claims),
    nombre: usuario?.nombre ?? null,
    clienteId: usuario?.cliente_id ?? null,
    negocio,
    introVista: usuario?.intro_vista ?? true,
  }
})
