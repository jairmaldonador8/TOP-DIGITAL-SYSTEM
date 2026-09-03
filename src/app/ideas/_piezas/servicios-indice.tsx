import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { Revelar } from '@/components/sitio/revelar'
import { precioMxn, SERVICIOS } from '@/lib/sitio/servicios'

/** El paquete premium no entra en la lista: cierra la sección como estrella. */
const PREMIUM = 'departamento-marketing'

/**
 * OPCIÓN A · Índice.
 *
 * Los siete servicios como un índice editorial: una fila por servicio, con
 * su precio alineado a la derecha. No usa portadas, así que la sección se
 * puede publicar hoy sin esperar las fotos del cliente. El departamento
 * externo cierra abajo, en una banda aparte, como el servicio estrella.
 */
export function ServiciosIndice() {
  const lista = SERVICIOS.filter((s) => s.slug !== PREMIUM)
  const premium = SERVICIOS.find((s) => s.slug === PREMIUM)

  return (
    <section id="servicios" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Servicios
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Todo lo que tu empresa necesita,
            <span className="text-marca"> en un solo equipo.</span>
          </h2>
        </Revelar>

        <ol className="mt-14 border-t border-white/10">
          {lista.map((servicio, i) => (
            <Revelar key={servicio.slug} delay={i * 60}>
              <li>
                <Link
                  href={`/servicios/${servicio.slug}`}
                  className="group grid grid-cols-[2.5rem_1fr] items-start gap-x-4 gap-y-2 border-b border-white/10 py-7 transition-colors hover:bg-white/[0.025] focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none sm:grid-cols-[3.5rem_1fr_auto] sm:items-center sm:gap-x-8"
                >
                  <span className="font-heading text-sm font-extrabold text-white/25 tabular-nums transition-colors group-hover:text-marca-magenta">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-heading text-xl font-extrabold tracking-tight sm:text-2xl">
                      {servicio.etiqueta}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {servicio.frase}
                    </p>
                  </div>

                  <div className="col-start-2 flex items-center justify-between gap-5 sm:col-start-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="block text-[0.62rem] tracking-[0.18em] text-muted-foreground uppercase">
                        Desde
                      </span>
                      <span className="font-heading mt-0.5 block text-lg font-extrabold tabular-nums">
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
                </Link>
              </li>
            </Revelar>
          ))}
        </ol>

        {premium ? (
          <Revelar delay={160} className="mt-14">
            <Link
              href={`/servicios/${premium.slug}`}
              className="group block rounded-3xl bg-marca p-px transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <div className="rounded-[calc(1.5rem-1px)] bg-background p-8 sm:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-marca rounded-full px-3 py-1 text-[0.6rem] font-extrabold tracking-[0.18em] text-black uppercase">
                    Servicio estrella
                  </span>
                  <span className="text-[0.62rem] tracking-[0.18em] text-muted-foreground uppercase">
                    Un solo cliente al mes
                  </span>
                </div>

                <div className="mt-7 grid gap-8 lg:grid-cols-[1.25fr_auto] lg:items-end">
                  <div>
                    <h3 className="font-heading text-2xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-4xl">
                      {premium.etiqueta}
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                      {premium.frase}
                    </p>
                    <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                      {SERVICIOS.filter((s) => s.enPremium).map((s) => (
                        <li
                          key={s.slug}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check aria-hidden className="size-4 text-marca-magenta" />
                          {s.etiqueta}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lg:text-right">
                    <span className="block text-[0.62rem] tracking-[0.18em] text-muted-foreground uppercase">
                      Desde
                    </span>
                    <span className="font-heading text-marca mt-1 block text-3xl font-extrabold tabular-nums sm:text-4xl">
                      {precioMxn(premium.desde)}
                    </span>
                    <span className="block text-sm font-semibold text-muted-foreground">
                      al mes
                    </span>
                    <span className="mt-5 flex items-center gap-2 text-sm font-semibold lg:justify-end">
                      Ver el paquete
                      <ArrowRight
                        aria-hidden
                        className="size-4 text-marca-magenta transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </Revelar>
        ) : null}

        <Revelar delay={200}>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Los montos son un punto de partida. Cada propuesta se cotiza a la
            medida de tu objetivo, tu mercado y tu alcance: el número final lo
            definimos juntos en la videollamada.
          </p>
        </Revelar>
      </div>
    </section>
  )
}
