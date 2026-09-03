'use client'

import { ChevronDown } from 'lucide-react'

import { Topi } from '@/components/sitio/marca'

/**
 * Cierre del hero: Topi chiquito señalando hacia abajo y la invitación a
 * ver el panel en vivo. Es el puente entre la promesa y la prueba — al
 * hacer clic baja rodando hasta la primera animación en vez de saltar de
 * golpe (con movimiento reducido sí salta, que es lo que se espera ahí).
 */
export function BajarAlPanel() {
  const bajar = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // En el sitio el destino es el panel; en las páginas del taller de
    // /ideas la primera animación es otra, así que se cae a la sección
    // que siga al hero — el enlace nunca queda muerto.
    const destino =
      document.getElementById('panel-leads') ??
      e.currentTarget.closest('section')?.nextElementSibling
    if (!destino) return
    e.preventDefault()
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    destino.scrollIntoView({
      behavior: quieto ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <a
      href="#panel-leads"
      onClick={bajar}
      className="group mx-auto mt-8 flex w-fit flex-col items-center gap-2 rounded-3xl px-6 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none sm:mt-10"
    >
      <Topi
        decorativo
        className="w-20 rotate-[-6deg] transition-transform duration-500 group-hover:-translate-y-1 sm:w-24"
      />

      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-white">
        Mira cómo se ven tus resultados en vivo
        <ChevronDown
          aria-hidden
          className="size-4 animate-bounce motion-reduce:animate-none"
        />
      </span>
    </a>
  )
}
