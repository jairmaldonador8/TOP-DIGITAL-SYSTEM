import { Esqueleto } from '@/components/paneles/esqueleto'
import { formatoFechaLarga } from '@/lib/formato'

/**
 * Carga de Mi día: fecha y saludo al instante; la tarjeta del día y las
 * listas de citas y pendientes llegan como fantasmas con su silueta.
 */
export default function CargandoMiDia() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header>
        <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
        <h1 className="text-2xl font-bold tracking-tight">Mi día</h1>
      </header>
      <Esqueleto className="h-24 rounded-3xl" />
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-5 w-16 rounded-md" />
        <Esqueleto className="h-40 rounded-2xl border border-border/60 bg-card" style={{ animationDelay: '120ms' }} />
      </div>
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-5 w-24 rounded-md" />
        <Esqueleto className="h-36 rounded-2xl border border-border/60 bg-card" style={{ animationDelay: '240ms' }} />
      </div>
      <p role="status" className="sr-only">
        Cargando Mi día…
      </p>
    </div>
  )
}
