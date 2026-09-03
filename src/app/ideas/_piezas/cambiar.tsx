'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Barra para saltar entre las direcciones visuales que estamos
 * explorando. Es andamio de taller, no parte del sitio: se va junto con
 * /ideas cuando se elija una dirección.
 */
const IDEAS = [
  { href: '/', nombre: 'Actual' },
  { href: '/ideas/mixta', nombre: 'Mixta' },
  { href: '/ideas/papel', nombre: 'Papel' },
  { href: '/ideas/bloques', nombre: 'Bloques' },
  { href: '/ideas/consola', nombre: 'Consola' },
  { href: '/ideas/leads-a', nombre: 'Leads A' },
  { href: '/ideas/leads-b', nombre: 'Leads B' },
  { href: '/ideas/leads-c', nombre: 'Leads C' },
  { href: '/ideas/leads-vivo', nombre: 'Vivo' },
  { href: '/ideas/servicios-a', nombre: 'Serv. A' },
  { href: '/ideas/servicios-b', nombre: 'Serv. B' },
  { href: '/ideas/servicios-c', nombre: 'Serv. C' },
  { href: '/ideas/redes-a', nombre: 'Redes A' },
  { href: '/ideas/redes-b', nombre: 'Redes B' },
  { href: '/ideas/redes-c', nombre: 'Redes C' },
  { href: '/ideas/fondo-negro', nombre: 'Negro' },
  { href: '/ideas/fondo-tinta', nombre: 'Tinta' },
  { href: '/ideas/fondo-carbon', nombre: 'Carbón' },
]

export function CambiarIdea() {
  const path = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex max-w-full justify-start overflow-x-auto px-4 sm:justify-center print:hidden">
      <nav className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-black/80 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <span className="px-3 text-[0.6rem] font-semibold tracking-[0.18em] text-white/40 uppercase">
          Idea
        </span>
        {IDEAS.map(({ href, nombre }) => {
          const activa = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activa
                  ? 'bg-marca text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {nombre}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
