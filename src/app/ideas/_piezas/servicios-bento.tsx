import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { Revelar } from '@/components/sitio/revelar'
import { precioMxn, SERVICIOS } from '@/lib/sitio/servicios'

const PREMIUM = 'departamento-marketing'

/**
 * Tamaño de cada tarjeta dentro del mosaico. El orden importa: la rejilla
 * es de 4 columnas y las piezas se acomodan para que no queden huecos.
 */
const FORMA: Record<string, string> = {
  branding: 'sm:col-span-2',
  'paginas-web': 'sm:col-span-2',
  'meta-ads': 'sm:col-span-2 lg:col-span-2',
  'google-ads': 'sm:col-span-2 lg:col-span-2',
  'tiendas-online': 'sm:col-span-2 lg:col-span-1',
  'chatbots-ia': 'sm:col-span-2 lg:col-span-1',
  'sistemas-y-software': 'sm:col-span-2 lg:col-span-2',
}

/**
 * OPCIÓN B · Mosaico.
 *
 * Rejilla asimétrica sin portadas: cada servicio ocupa el espacio que le
 * toca por peso comercial, y el departamento externo abre la sección como
 * pieza grande con el degradado de marca encima.
 */
export function ServiciosBento() {
  const lista = SERVICIOS.filter((s) => s.slug !== PREMIUM)
  const premium = SERVICIOS.find((s) => s.slug === PREMIUM)

  return (
    <section id="servicios" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Servicios
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Todo lo que tu empresa necesita,
            <span className="text-marca"> en un solo equipo.</span>
          </h2>
        </Revelar>

        <div className="mt-12 grid gap-4 sm:grid-cols-4">
          {premium ? (
            <Revelar className="sm:col-span-4">
              <Link
                href={`/servicios/${premium.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-marca-magenta/40 p-8 transition-colors hover:border-marca-magenta/70 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none sm:p-11"
              >
                <div
                  aria-hidden
                  className="bg-marca pointer-events-none absolute inset-0 opacity-[0.09] transition-opacity group-hover:opacity-[0.14]"
                />

                <div className="relative">
                  <span className="bg-marca inline-block rounded-full px-3 py-1 text-[0.6rem] font-extrabold tracking-[0.18em] text-black uppercase">
                    Servicio estrella
                  </span>
                  <h3 className="font-heading mt-6 max-w-2xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl">
                    {premium.etiqueta}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                    {premium.frase}
                  </p>
                </div>

                <div className="relative mt-9 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-7">
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
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
                  <div className="text-right">
                    <span className="block text-[0.62rem] tracking-[0.18em] text-muted-foreground uppercase">
                      Desde
                    </span>
                    <span className="font-heading text-marca mt-1 block text-3xl font-extrabold tabular-nums">
                      {precioMxn(premium.desde)}
                      <span className="text-base font-semibold text-muted-foreground">
                        {' '}
                        / mes
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </Revelar>
          ) : null}

          {lista.map((servicio, i) => (
            <Revelar
              key={servicio.slug}
              delay={(i % 3) * 70}
              className={FORMA[servicio.slug] ?? 'sm:col-span-2'}
            >
              <Link
                href={`/servicios/${servicio.slug}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-marca-magenta/50 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none"
              >
                <div>
                  <h3 className="font-heading text-xl font-extrabold tracking-tight sm:text-2xl">
                    {servicio.etiqueta}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {servicio.frase}
                  </p>
                </div>

                <div className="mt-8 flex items-end justify-between gap-4">
                  <div>
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
            </Revelar>
          ))}
        </div>

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
