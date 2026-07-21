import Link from 'next/link'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { CifraAnimada } from '@/components/paneles/cifra-animada'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Tarjeta de métrica de los paneles. `destacada` la pinta con el degradado
 * de marca: úsala en UNA sola métrica por vista (la protagonista). Con
 * `href` la tarjeta entera es un enlace a su sección (con lift al hover).
 * `cifra` anima el valor de 0 a su total; `tendencia` compara contra el
 * periodo anterior y `sparkline` pinta mini barras (p. ej. leads por día).
 */
export function StatCard({
  titulo,
  valor,
  detalle,
  destacada = false,
  href,
  cifra,
  tendencia,
  sparkline,
  className,
}: {
  titulo: string
  valor?: string
  detalle?: string
  destacada?: boolean
  href?: string
  cifra?: { valor: number; formato?: 'entero' | 'moneda'; sufijo?: string }
  tendencia?: { delta: number; texto: string }
  sparkline?: number[]
  className?: string
}) {
  const maximo = sparkline ? Math.max(...sparkline, 1) : 1

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
      <p className="text-3xl font-bold tracking-tight">
        {cifra ? (
          <CifraAnimada
            valor={cifra.valor}
            formato={cifra.formato}
            sufijo={cifra.sufijo}
          />
        ) : (
          valor
        )}
      </p>
      {tendencia ? (
        <p
          className={cn(
            'flex items-center gap-1 text-xs font-semibold',
            destacada
              ? 'text-white/90'
              : tendencia.delta >= 0
                ? 'text-marca-magenta'
                : 'text-muted-foreground'
          )}
        >
          {tendencia.delta >= 0 ? (
            <TrendingUp aria-hidden className="size-3.5" />
          ) : (
            <TrendingDown aria-hidden className="size-3.5" />
          )}
          {tendencia.texto}
        </p>
      ) : null}
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
      {sparkline && sparkline.length > 0 ? (
        <div aria-hidden className="mt-2 flex h-7 items-end gap-[3px]">
          {sparkline.map((punto, i) => (
            <span
              key={i}
              className={cn(
                'animar-crecer-y min-h-[3px] flex-1 rounded-full',
                destacada ? 'bg-white/45' : 'bg-marca opacity-80'
              )}
              style={{
                height: `${Math.max(10, (punto / maximo) * 100)}%`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      ) : null}
    </Card>
  )

  if (!href) return tarjeta
  return (
    <Link
      href={href}
      aria-label={`${titulo} — ver sección`}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {tarjeta}
    </Link>
  )
}
