import { cn } from '@/lib/utils'

export type EstadoCliente = 'activo' | 'pausado' | 'inactivo'

const ESTILOS: Record<EstadoCliente, string> = {
  activo: 'bg-marca text-white',
  pausado: 'bg-amber-500/15 text-amber-400',
  inactivo: 'bg-muted text-muted-foreground',
}

const ETIQUETAS: Record<EstadoCliente, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  inactivo: 'Inactivo',
}

/**
 * Pill de estado de cliente. Componente propio (sin Base UI) para poder
 * usarse igual en Server Components y Client Components.
 */
export function EstadoClienteBadge({
  estado,
  className,
}: {
  estado: EstadoCliente
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-4xl px-2 text-xs font-medium whitespace-nowrap',
        ESTILOS[estado],
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {ETIQUETAS[estado]}
    </span>
  )
}
