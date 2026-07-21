import { cn } from '@/lib/utils'

/** Bloque fantasma pulsante para estados de carga. */
export function Esqueleto({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-muted/50', className)}
      style={style}
    />
  )
}

/**
 * Estado de carga de una sección: el encabezado es real —el título aparece
 * al instante al navegar, sin esperar datos— y debajo van tarjetas fantasma
 * con la silueta del contenido final.
 */
export function SeccionCargando({
  titulo,
  descripcion,
  conAccion = false,
  filas = 4,
}: {
  titulo: string
  descripcion: string
  /** Reserva el hueco del botón de acción del encabezado (p. ej. Clientes). */
  conAccion?: boolean
  filas?: number
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
        </div>
        {conAccion ? <Esqueleto className="h-9 w-36 rounded-full" /> : null}
      </header>
      <div className="flex flex-col gap-3">
        {Array.from({ length: filas }, (_, i) => (
          <Esqueleto
            key={i}
            className="h-20 rounded-2xl border border-border/60 bg-card"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        Cargando {titulo}…
      </p>
    </div>
  )
}
