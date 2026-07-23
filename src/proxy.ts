import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { AREA_POR_ROL, rolDesdeClaims, rolPuedeAcceder } from '@/lib/auth/redirect'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: sin lógica entre createServerClient y getClaims —
  // getClaims refresca el token; interponer código causa cierres de
  // sesión aleatorios.
  const { data } = await supabase.auth.getClaims()

  const claims = data?.claims
  const rol = rolDesdeClaims(claims)
  const path = request.nextUrl.pathname

  const redirigir = (destino: string) => {
    const response = NextResponse.redirect(new URL(destino, request.url))
    // Conservar las cookies de sesión refrescadas.
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value, ...options }) =>
        response.cookies.set(name, value, options)
      )
    return response
  }

  // Sin sesión: solo la landing y /login son accesibles.
  const esPublica = path === '/' || path === '/login'
  if (!claims && !esPublica) {
    return redirigir('/login')
  }

  // Sesión autenticada sin rol válido: sesión inválida. Cerrarla y
  // enviar a /login (evita el ping-pong /agencia ↔ /portal y el bucle
  // autenticado-en-/login).
  if (claims && !rol) {
    // scope 'local': invalida solo la sesión de este navegador; no
    // cierra las sesiones del usuario en otros dispositivos.
    await supabase.auth.signOut({ scope: 'local' })
    return path === '/login' ? supabaseResponse : redirigir('/login')
  }

  if (rol) {
    // Con sesión válida en /login: enviar a su área.
    if (path === '/login') {
      return redirigir(AREA_POR_ROL[rol])
    }

    // Guarda de áreas: cada rol solo accede a su propia área.
    if (!rolPuedeAcceder(rol, path)) {
      return redirigir(AREA_POR_ROL[rol])
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico y manifest.webmanifest (el navegador pide el manifest
     *   SIN cookies: si pasara por el proxy, redirigiría a /login y la
     *   instalación como app fallaría)
     * - imágenes (svg, png, jpg, jpeg, gif, webp)
     * - api/cron (el cron de Vercel manda `Authorization: Bearer
     *   <CRON_SECRET>` sin cookies de sesión; el propio route handler
     *   valida ese secreto. Vercel cron NO sigue redirects, así que si
     *   esta ruta pasara por el proxy moriría en un 307 silencioso a
     *   /login)
     *
     * El resto de /api SÍ pasa por el proxy; cualquier route handler
     * nuevo que no deba llevar sesión (p. ej. otro webhook público) hay
     * que agregarlo explícitamente aquí.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
