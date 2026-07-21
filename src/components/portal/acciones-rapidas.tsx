'use client'

import Link from 'next/link'
import { MegaphoneIcon, MessageCircleIcon, TargetIcon } from 'lucide-react'

const base =
  'flex h-24 flex-col items-center justify-center gap-2 rounded-2xl text-xs font-semibold outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.97] sm:text-sm'

/**
 * Fila de acciones rápidas del portal (estilo app financiera): atajos
 * grandes y táctiles a las secciones clave. "Chat directo" abre el chat
 * flotante disparando el evento que ChatFlotante escucha.
 */
export function AccionesRapidas() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Link href="/portal/leads" className={`${base} bg-primary text-white`}>
        <TargetIcon aria-hidden className="size-5" />
        Mis Leads
      </Link>
      <Link href="/portal/campanias" className={`${base} bg-marca text-white`}>
        <MegaphoneIcon aria-hidden className="size-5" />
        Campañas
      </Link>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('abrir-chat-portal'))}
        className={`${base} cursor-pointer border border-border bg-card`}
      >
        <MessageCircleIcon aria-hidden className="size-5 text-marca-magenta" />
        Chat directo
      </button>
    </div>
  )
}
