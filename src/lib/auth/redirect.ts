/**
 * Fuente única de verdad para el mapeo rol → área y las redirecciones
 * por rol. La consumen `src/app/page.tsx` y `src/proxy.ts`.
 *
 * Una sesión autenticada SIN rol válido se considera inválida: su
 * destino es /login (el proxy además cierra esa sesión).
 */

export type Rol = 'admin' | 'cliente' | 'equipo'

/**
 * Forma mínima de los claims del JWT que necesitamos. El índice permite
 * pasar el `JwtPayload` de Supabase sin casts.
 */
export type ClaimsConRol = {
  user_role?: unknown
  [claim: string]: unknown
}

export const AREA_POR_ROL: Record<Rol, string> = {
  admin: '/agencia',
  cliente: '/portal',
  equipo: '/equipo',
}

/**
 * Extrae y valida el rol de los claims del JWT. Devuelve null si no hay
 * claims o si `user_role` falta o no es un rol conocido.
 */
export function rolDesdeClaims(
  claims: ClaimsConRol | null | undefined
): Rol | null {
  const rol = claims?.user_role
  return rol === 'admin' || rol === 'cliente' || rol === 'equipo' ? rol : null
}

/**
 * Indica si un rol puede acceder a una ruta. Cada rol solo puede entrar
 * a su propia área; las rutas fuera de las áreas protegidas están
 * permitidas para cualquier rol.
 */
export function rolPuedeAcceder(rol: Rol, pathname: string): boolean {
  const areaSolicitada = Object.values(AREA_POR_ROL).find(
    (area) => pathname === area || pathname.startsWith(`${area}/`)
  )
  return !areaSolicitada || areaSolicitada === AREA_POR_ROL[rol]
}

/**
 * Ruta destino según los claims del JWT:
 * - Sin sesión o sin rol válido → /login
 * - admin → /agencia
 * - cliente → /portal
 * - equipo → /equipo
 */
export function destinoPorRol(
  claims: ClaimsConRol | null | undefined
): string {
  const rol = rolDesdeClaims(claims)
  return rol ? AREA_POR_ROL[rol] : '/login'
}
