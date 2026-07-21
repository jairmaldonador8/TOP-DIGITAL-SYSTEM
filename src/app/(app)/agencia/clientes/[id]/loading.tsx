import { Esqueleto } from '@/components/paneles/esqueleto'

/** Carga del detalle de cliente: el título depende del dato, va fantasma. */
export default function CargandoCliente() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <Esqueleto className="h-8 w-64" />
        <Esqueleto className="mt-2 h-4 w-40" />
      </header>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto
            key={i}
            className="h-20 rounded-2xl border border-border/60 bg-card"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        Cargando cliente…
      </p>
    </div>
  )
}
