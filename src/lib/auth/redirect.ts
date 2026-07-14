/**
 * Devuelve la ruta destino según el rol contenido en los claims del JWT.
 *
 * - Sin sesión (claims null/undefined) → /login
 * - user_role 'admin' → /agencia
 * - Cualquier otro caso (cliente o rol ausente) → /portal
 *
 * Fuente única de verdad para las redirecciones por rol: la usan
 * `src/app/page.tsx` y `src/proxy.ts`.
 */
export function destinoPorRol(
  claims: { user_role?: string } | null | undefined
): string {
  if (!claims) {
    return '/login'
  }
  if (claims.user_role === 'admin') {
    return '/agencia'
  }
  return '/portal'
}
