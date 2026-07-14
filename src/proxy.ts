import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { destinoPorRol } from '@/lib/auth/redirect'

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
  const role = claims?.user_role as string | undefined
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

  // Sin sesión: solo /login es accesible.
  if (!claims && path !== '/login') {
    return redirigir('/login')
  }

  // Con sesión en /login: enviar a su área.
  if (claims && path === '/login') {
    return redirigir(destinoPorRol({ user_role: role }))
  }

  if (path.startsWith('/agencia') && role !== 'admin') {
    return redirigir('/portal')
  }

  if (path.startsWith('/portal') && role !== 'cliente') {
    return redirigir('/agencia')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - imágenes (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
