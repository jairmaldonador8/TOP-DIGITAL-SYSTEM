import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  MessageCircle,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react'

import { Card } from '@/components/ui/card'

const ICONOS = {
  chat: MessageCircle,
  tarea: CalendarClock,
  lead: UserRoundSearch,
} as const

export type PuntoAtencion = {
  id: string
  icono: keyof typeof ICONOS
  cantidad: number
  titulo: string
  detalle: string
  href: string
}

/**
 * "Requiere tu atención": lo urgente del día convertido en atajos — cada
 * tarjeta lleva directo a resolverlo. Sin pendientes, celebra el día limpio.
 */
export function Atencion({ puntos }: { puntos: PuntoAtencion[] }) {
  if (puntos.length === 0) {
    return (
      <Card className="flex-row items-center gap-4 px-6 py-4">
        <span
          aria-hidden
          className="bg-marca flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
        >
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Todo al día</p>
          <p className="text-xs text-muted-foreground">
            Sin mensajes pendientes ni tareas vencidas. Buen momento para
            revisar tus leads.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {puntos.map((punto, i) => {
        const Icono = ICONOS[punto.icono]
        return (
          <Link
            key={punto.id}
            href={punto.href}
            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both block rounded-2xl outline-none duration-500 focus-visible:ring-2 focus-visible:ring-ring/60"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <Card className="group flex-row items-center gap-4 px-5 py-4">
              <span
                aria-hidden
                className="bg-marca flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
              >
                <Icono className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {punto.titulo}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {punto.detalle}
                </p>
              </div>
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
