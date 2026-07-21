import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Tarjeta de métrica de los paneles. `destacada` la pinta con el degradado
 * de marca: úsala en UNA sola métrica por vista (la protagonista). Con
 * `href` la tarjeta entera es un enlace a su sección (con lift al hover).
 */
export function StatCard({
  titulo,
  valor,
  detalle,
  destacada = false,
  href,
  className,
}: {
  titulo: string
  valor: string
  detalle?: string
  destacada?: boolean
  href?: string
  className?: string
}) {
  const tarjeta = (
    <Card
      className={cn(
        'gap-1.5 px-6 py-5',
        destacada && 'bg-marca border-0 text-white',
        className
      )}
    >
      <p
        className={cn(
          'text-[13px] font-medium',
          destacada ? 'text-white/85' : 'text-muted-foreground'
        )}
      >
        {titulo}
      </p>
      <p className="text-3xl font-bold tracking-tight">{valor}</p>
      {detalle ? (
        <p
          className={cn(
            'text-xs',
            destacada ? 'text-white/85' : 'text-muted-foreground'
          )}
        >
          {detalle}
        </p>
      ) : null}
    </Card>
  )

  if (!href) return tarjeta
  return (
    <Link
      href={href}
      aria-label={`${titulo}: ${valor} — ver sección`}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {tarjeta}
    </Link>
  )
}
