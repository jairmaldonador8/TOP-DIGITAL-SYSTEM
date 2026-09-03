'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { BotonCta } from '@/components/sitio/cta'
import { Lockup } from '@/components/sitio/marca'
import { URL_LOGIN } from '@/lib/sitio/plataforma'

const SECCIONES = [
  { href: '/servicios', texto: 'Servicios' },
  { href: '/casos', texto: 'Casos de éxito' },
  { href: '/blog', texto: 'Blog' },
  { href: '/redes', texto: 'Redes sociales' },
]

/**
 * Navegación del sitio. El logo es el enlace a Home (petición del cliente).
 * La barra se vuelve sólida al bajar para que el logo nunca compita con el
 * contenido, y en móvil abre un panel completo.
 */
export function NavSitio() {
  const ruta = usePathname()
  const [bajado, setBajado] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const alScroll = () => setBajado(window.scrollY > 24)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  // Mientras el panel está abierto, la página de atrás no debe moverse.
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierto])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        bajado || abierto
          ? 'border-b border-white/10 bg-background/85 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="Top Digital — inicio"
          className="shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none"
        >
          <Lockup className="h-9 w-auto text-white sm:h-10" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {SECCIONES.map(({ href, texto }) => {
            const activo = ruta === href || ruta.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activo
                      ? 'bg-white/10 text-white'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {texto}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={URL_LOGIN}
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white sm:block"
          >
            Iniciar sesión
          </Link>
          {/* La visibilidad va en el envoltorio: el botón trae su propio
              `inline-flex` y una clase `hidden` encima no le ganaría. */}
          <span className="hidden md:block">
            <BotonCta tamano="chico" texto="Agendar diagnóstico gratis" />
          </span>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {abierto ? (
        <div
          className="border-t border-white/10 bg-background lg:hidden"
          // Cualquier navegación desde el panel lo cierra: así no hace
          // falta un efecto que observe la ruta para lo mismo.
          onClick={() => setAbierto(false)}
        >
          <ul className="mx-auto flex w-full max-w-7xl flex-col px-5 py-4 sm:px-8">
            {SECCIONES.map(({ href, texto }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block border-b border-white/8 py-4 text-lg font-semibold text-white"
                >
                  {texto}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={URL_LOGIN}
                className="block py-4 text-sm font-medium text-muted-foreground"
              >
                Iniciar sesión
              </Link>
            </li>
            <li className="pt-2 pb-4">
              <BotonCta className="w-full" />
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
