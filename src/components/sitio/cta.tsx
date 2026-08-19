import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * CTA único del sitio: agendar la videollamada de diagnóstico. Se repite
 * al cierre de cada sección, siempre con el mismo texto y el mismo destino
 * (/agendar), para que el visitante nunca dude de cuál es el siguiente paso.
 */
export function BotonCta({
  className = '',
  tamano = 'grande',
  texto = 'Agendar videollamada de diagnóstico gratis',
}: {
  className?: string
  tamano?: 'grande' | 'chico'
  texto?: string
}) {
  const medidas =
    tamano === 'grande'
      ? 'h-14 px-8 text-base sm:text-[1.05rem]'
      : 'h-11 px-5 text-sm'

  return (
    <Link
      href="/agendar"
      className={`bg-marca group inline-flex items-center justify-center gap-2.5 rounded-full font-semibold text-white shadow-[0_10px_44px_-10px_rgba(240,51,141,0.6)] transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${medidas} ${className}`}
    >
      <span className="text-center leading-tight">{texto}</span>
      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

/**
 * Cierre de sección: la frase de la marca y el CTA. Se usa entre bloques
 * para mantener el ritmo de conversión sin repetir maquetación.
 */
export function CierreCta({
  titulo,
  nota,
}: {
  titulo: React.ReactNode
  nota?: string
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-heading max-w-3xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl">
        {titulo}
      </h2>
      <BotonCta />
      {nota ? (
        <p className="text-sm text-muted-foreground">{nota}</p>
      ) : null}
    </div>
  )
}
