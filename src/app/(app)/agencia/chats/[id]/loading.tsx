import { Esqueleto } from '@/components/paneles/esqueleto'

/** Carga de una conversación: el nombre del cliente va fantasma. */
export default function CargandoChat() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <Esqueleto className="h-7 w-56" />
        <Esqueleto className="mt-2 h-4 w-36" />
      </header>
      <Esqueleto className="h-[28rem] rounded-2xl border border-border/60 bg-card" />
      <p role="status" className="sr-only">
        Cargando conversación…
      </p>
    </div>
  )
}
