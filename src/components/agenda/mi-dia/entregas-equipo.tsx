import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'

import type { EntregaDia } from '@/lib/agenda/tipos'
import { cn } from '@/lib/utils'

/** Encargos del equipo que vencen hoy o ya se atrasaron (oculta si no hay). */
export function EntregasEquipo({ entregas }: { entregas: EntregaDia[] }) {
  if (entregas.length === 0) return null

  return (
    <section aria-labelledby="t-entregas" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id="t-entregas" className="font-semibold">Entregas del equipo</h2>
        <Link
          href="/agencia/equipo"
          className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Ver equipo
          <ChevronRightIcon aria-hidden className="size-4" />
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/60 bg-card px-4">
        {entregas.map((e) => (
          <li key={e.id} className="flex min-h-12 items-center gap-3 py-2">
            <span className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-medium">{e.integrante}</span>
              <span className="text-muted-foreground"> · {e.titulo}</span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                e.atrasada ? 'bg-marca-naranja/15 text-marca-naranja' : 'bg-marca-magenta/15 text-marca-magenta'
              )}
            >
              {e.atrasada ? 'atrasada' : 'vence hoy'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
