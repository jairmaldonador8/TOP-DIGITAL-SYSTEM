import { Esqueleto } from '@/components/paneles/esqueleto'
import { formatoFechaLarga } from '@/lib/formato'

/**
 * Carga del dashboard de agencia: saludo y fecha aparecen al instante
 * (no dependen de datos); las métricas y módulos llegan como fantasmas
 * con la silueta del contenido real.
 */
export default function CargandoDashboardAgencia() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hola 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preparando tu resumen del día…
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto
            key={i}
            className="h-32 rounded-2xl border border-border/60 bg-card"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Esqueleto className="h-72 rounded-2xl border border-border/60 bg-card" />
        <Esqueleto
          className="h-72 rounded-2xl border border-border/60 bg-card"
          style={{ animationDelay: '150ms' }}
        />
      </div>
      <p role="status" className="sr-only">
        Cargando dashboard…
      </p>
    </div>
  )
}
