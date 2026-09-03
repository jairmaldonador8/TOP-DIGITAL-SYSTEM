import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { BotonCta } from '@/components/sitio/cta'
import { Topi } from '@/components/sitio/marca'
import { Revelar } from '@/components/sitio/revelar'
import { PROBLEMAS } from '@/lib/sitio/contenido'
import { servicioPorSlug } from '@/lib/sitio/servicios'

/**
 * Traduce el dolor del visitante al servicio que lo resuelve. Cada tarjeta
 * dice el problema con sus palabras y responde con el servicio, para que
 * nadie tenga que adivinar qué contratar.
 */
export function Problemas() {
  return (
    <section
      id="problemas"
      className="relative overflow-hidden border-t border-white/10 py-20 sm:py-28"
    >

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-3xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Problemas y soluciones
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Para cada problema de tu empresa,
            <span className="text-marca"> somos tu solución.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Identifica el que te suene familiar. Del lado derecho está lo que
            necesitas contratar.
          </p>
        </Revelar>

        <ul className="mt-12 grid gap-4 lg:grid-cols-2">
          {PROBLEMAS.map(({ problema, servicio }, i) => {
            const datos = servicioPorSlug(servicio)
            if (!datos) return null
            return (
              <Revelar key={servicio} delay={i * 70}>
                <li className="h-full">
                  <Link
                    href={`/servicios/${servicio}`}
                    className="group flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-marca-magenta/50 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none sm:flex-row sm:items-center sm:gap-7"
                  >
                    <p className="flex-1 text-[1.05rem] leading-relaxed text-foreground/90">
                      <span className="text-muted-foreground">“</span>
                      {problema}
                      <span className="text-muted-foreground">”</span>
                    </p>
                    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2 sm:text-right">
                      <ArrowRight
                        aria-hidden
                        className="size-5 text-marca-magenta transition-transform group-hover:translate-x-1 sm:rotate-0"
                      />
                      <span className="font-heading text-base font-extrabold sm:text-lg">
                        {datos.etiqueta}
                      </span>
                    </div>
                  </Link>
                </li>
              </Revelar>
            )
          })}
        </ul>

        {/* Servicio premium: todos los problemas a la vez. */}
        <Revelar delay={150} className="mt-6">
          <div className="bg-marca relative overflow-hidden rounded-3xl p-[1.5px]">
            <div className="relative grid gap-8 rounded-[calc(1.5rem-1px)] bg-[#0a070d] p-8 sm:p-11 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
              <div>
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-marca-naranja uppercase">
                  Servicio premium
                </p>
                <h3 className="font-heading mt-4 text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
                  ¿Tu empresa tiene todos estos problemas y quieres
                  solucionarlos de una vez por todas?
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Contrata nuestro{' '}
                  <strong className="text-foreground">
                    departamento de marketing externo
                  </strong>
                  : marca, sitio, campañas, contenido y automatización con un
                  solo responsable y una sola estrategia.
                </p>
                <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-marca-naranja/40 bg-marca-naranja/10 px-4 py-2 text-sm font-semibold text-marca-naranja">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-marca-naranja"
                  />
                  Solo aceptamos 1 cliente al mes en este servicio
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <BotonCta texto="Agenda tu videollamada" />
                  <Link
                    href="/servicios/departamento-marketing"
                    className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Ver qué incluye
                  </Link>
                </div>
              </div>

              <div aria-hidden className="relative hidden justify-center lg:flex">
                <div className="absolute inset-0 m-auto size-56 rounded-full bg-marca-magenta/25 blur-[80px]" />
                <Topi
                  decorativo
                  pose="parado"
                  className="relative w-full max-w-[14rem] text-white"
                />
              </div>
            </div>
          </div>
        </Revelar>
      </div>
    </section>
  )
}
