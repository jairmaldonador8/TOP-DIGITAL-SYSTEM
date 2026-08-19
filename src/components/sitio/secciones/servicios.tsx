import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { CierreCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { precioMxn, SERVICIOS } from '@/lib/sitio/servicios'

/**
 * Recuadros de servicio: portada, frase y precio de arranque. Cada tarjeta
 * lleva a su página, donde vive la historia completa y los proyectos que
 * hemos entregado de ese servicio.
 */
export function Servicios({
  titulo = (
    <>
      Todo lo que tu empresa necesita,
      <span className="text-marca"> en un solo equipo.</span>
    </>
  ),
  conCierre = true,
}: {
  titulo?: React.ReactNode
  conCierre?: boolean
}) {
  return (
    <section
      id="servicios"
      className="border-t border-white/10 py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Servicios
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            {titulo}
          </h2>
        </Revelar>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((servicio, i) => (
            <Revelar key={servicio.slug} delay={(i % 3) * 80}>
              <li className="h-full">
                <Link
                  href={`/servicios/${servicio.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-marca-magenta/50 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none"
                >
                  <Foto
                    alt={`Portada de ${servicio.nombre}`}
                    pie={`Portada del servicio: ${servicio.etiqueta}`}
                    ratio="aspect-[16/10]"
                    className="rounded-none border-0 border-b border-white/10"
                  />

                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="font-heading text-xl font-extrabold tracking-tight">
                      {servicio.etiqueta}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {servicio.frase}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                      <div>
                        <span className="block text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
                          Desde
                        </span>
                        <span className="font-heading mt-1 block text-lg font-extrabold">
                          {precioMxn(servicio.desde)}
                          {servicio.periodo === 'mes' ? (
                            <span className="text-sm font-semibold text-muted-foreground">
                              {' '}
                              / mes
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <ArrowRight
                        aria-hidden
                        className="size-5 shrink-0 text-marca-magenta transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              </li>
            </Revelar>
          ))}
        </ul>

        <Revelar delay={120}>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Los montos son un punto de partida. Cada propuesta se cotiza a la
            medida de tu objetivo, tu mercado y tu alcance — el número final lo
            definimos juntos en la videollamada.
          </p>
        </Revelar>

        {conCierre ? (
          <Revelar delay={150} className="mt-20">
            <CierreCta
              titulo={
                <>
                  ¿No sabes cuál necesitas?
                  <br className="hidden sm:block" />
                  <span className="text-marca"> Te lo decimos en la llamada.</span>
                </>
              }
              nota="Sin costo, sin compromiso y con recomendaciones concretas."
            />
          </Revelar>
        ) : null}
      </div>
    </section>
  )
}
