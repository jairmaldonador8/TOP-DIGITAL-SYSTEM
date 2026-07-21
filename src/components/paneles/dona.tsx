import { CifraAnimada } from '@/components/paneles/cifra-animada'

/**
 * Dona SVG de progreso que se dibuja al entrar (animar-dona).
 * `tono="blanco"` para tarjetas con fondo de marca; `tono="marca"` traza el
 * arco con el degradado (requiere un `id` único por página para el gradiente).
 */
export function Dona({
  pct,
  id,
  tono = 'marca',
  etiqueta,
}: {
  pct: number
  id: string
  tono?: 'marca' | 'blanco'
  etiqueta?: string
}) {
  const radio = 50
  const circunferencia = 2 * Math.PI * radio
  const arco =
    (Math.min(Math.max(pct, 0), 100) / 100) * circunferencia
  const trazo = tono === 'blanco' ? 'currentColor' : `url(#dona-${id})`

  return (
    <div className="relative">
      <svg
        viewBox="0 0 120 120"
        className="size-32 -rotate-90 sm:size-36"
        aria-hidden
      >
        {tono === 'marca' ? (
          <defs>
            <linearGradient
              id={`dona-${id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--color-marca-violeta)" />
              <stop offset="55%" stopColor="var(--color-marca-magenta)" />
              <stop offset="100%" stopColor="var(--color-marca-naranja)" />
            </linearGradient>
          </defs>
        ) : null}
        <circle
          cx="60"
          cy="60"
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeOpacity={tono === 'blanco' ? 0.25 : 0.1}
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r={radio}
          fill="none"
          stroke={trazo}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arco} ${circunferencia}`}
          className="animar-dona"
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight sm:text-3xl">
          <CifraAnimada valor={Math.round(pct)} sufijo="%" />
        </span>
        {etiqueta ? (
          <span className="text-[10px] text-muted-foreground">{etiqueta}</span>
        ) : null}
      </p>
    </div>
  )
}
