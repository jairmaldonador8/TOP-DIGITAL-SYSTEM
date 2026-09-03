import { ArrowUpRight } from 'lucide-react'

import { Newsletter } from '@/components/sitio/newsletter'
import { Revelar } from '@/components/sitio/revelar'
import { CUENTAS } from '@/lib/sitio/redes'

/**
 * Cierre del sitio: las cinco cuentas y la invitación al newsletter. Es la
 * salida para quien todavía no quiere agendar pero sí quedarse cerca.
 *
 * Cada red se reconoce por el halo del color de su propia plataforma, no
 * por su logo: los logos son marcas registradas y además meterían cinco
 * paletas ajenas encima de la de Top Digital. El newsletter va debajo de
 * todas, a lo ancho, para que cierre la página en lugar de competir con
 * la rejilla.
 */
export function Redes() {
  return (
    <section id="redes" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Redes sociales
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Síguenos en
            <span className="text-marca"> nuestras redes sociales.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            En cada una publicamos algo distinto. Escoge la que te acomode: en
            todas vas a encontrar cosas que puedes aplicar sin contratarnos.
          </p>
        </Revelar>

        <Revelar delay={100} className="mt-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CUENTAS.map(({ nombre, cuenta, href, detalle, tinte }) => (
              <li key={nombre} className="h-full">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/25 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none"
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -top-14 -left-8 size-44 rounded-full bg-gradient-to-br ${tinte} opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-50`}
                  />

                  <div className="relative">
                    <span className="font-heading block text-lg font-extrabold tracking-tight">
                      {nombre}
                    </span>
                    <span className="mt-1 block truncate text-sm text-foreground/70">
                      {cuenta}
                    </span>
                  </div>

                  <div className="relative mt-8 flex items-end justify-between gap-3">
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {detalle}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 shrink-0 text-white/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Revelar>

        <Revelar delay={160} className="mt-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9">
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-heading text-lg font-extrabold tracking-tight">
                  Suscríbete al newsletter
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Una vez al mes: lo que está funcionando en campañas, casos
                  reales y recursos que puedes aplicar el mismo día.
                </p>
              </div>
              <div className="lg:w-96">
                <Newsletter />
              </div>
            </div>
          </div>
        </Revelar>
      </div>
    </section>
  )
}
