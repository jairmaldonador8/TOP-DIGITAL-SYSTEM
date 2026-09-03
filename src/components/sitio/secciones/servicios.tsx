import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { CierreCta } from '@/components/sitio/cta'
import { Topi } from '@/components/sitio/marca'
import { Revelar } from '@/components/sitio/revelar'
import {
  precioMxn,
  SERVICIOS,
  SERVICIOS_PREMIUM,
} from '@/lib/sitio/servicios'

/** El paquete premium no va en la rejilla: cierra la sección como estrella. */
const PREMIUM = 'departamento-marketing'

/**
 * Portada del servicio.
 *
 * Es el hueco donde irá la foto real cuando el cliente la entregue.
 * Mientras tanto se resuelve con tipografía —el número de orden en grande
 * detrás y el nombre en degradado— para que la tarjeta se vea terminada
 * y no como un marcador vacío. Al llegar las fotos solo se sustituye esta
 * pieza por la imagen, sin tocar el resto de la tarjeta.
 */
function Portada({ indice, etiqueta }: { indice: number; etiqueta: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-white/[0.02]">
      <div
        aria-hidden
        className="bg-marca absolute -top-16 -right-12 size-56 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35"
      />
      <span
        aria-hidden
        className="font-heading absolute -bottom-6 -left-2 text-[7rem] leading-none font-extrabold text-white/[0.05] tabular-nums select-none"
      >
        {String(indice).padStart(2, '0')}
      </span>
      <div className="relative flex h-full items-end p-6">
        <span className="font-heading text-marca text-2xl leading-[1.1] font-extrabold tracking-tight text-balance">
          {etiqueta}
        </span>
      </div>
    </div>
  )
}

/**
 * Vitrina de servicios: una tarjeta por servicio con su portada, su frase
 * y su precio de arranque; cada una lleva a la página donde vive la
 * historia completa. Debajo de todas, el departamento externo como
 * servicio estrella.
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
            {titulo}
          </h2>
        </Revelar>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((servicio, i) => (
            <Revelar key={servicio.slug} delay={(i % 3) * 80}>
              <li className="h-full">
                <Link
                  href={`/servicios/${servicio.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-marca-magenta/50 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:outline-none"
                >
                  <Portada indice={i + 1} etiqueta={servicio.etiqueta} />

                  <div className="flex flex-1 flex-col p-7">
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {servicio.frase}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
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
                  </div>
                </Link>
              </li>
            </Revelar>
          ))}
        </ul>

        {premium ? (
          <Revelar delay={140} className="mt-5">
            <Link
              href={`/servicios/${premium.slug}`}
              className="bg-marca group relative block overflow-hidden rounded-3xl p-[1.5px] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-marca-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <div className="relative grid gap-8 rounded-[calc(1.5rem-1px)] bg-[#0a070d] p-8 sm:p-11 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
                <div>
                <span className="bg-marca inline-block rounded-full px-3 py-1 text-[0.6rem] font-extrabold tracking-[0.18em] text-black uppercase">
                  Servicio estrella
                </span>
                <h3 className="font-heading mt-6 text-2xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-4xl">
                  {premium.etiqueta}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                  {premium.frase}
                </p>

                <ul className="mt-7 grid gap-2 sm:grid-cols-2">
                  {SERVICIOS_PREMIUM.map((s) => (
                    <li
                      key={s.slug}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        aria-hidden
                        className="size-4 shrink-0 text-marca-magenta"
                      />
                      {s.etiqueta}
                    </li>
                  ))}
                </ul>

                <p className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-marca-naranja/40 bg-marca-naranja/10 px-4 py-2 text-sm font-semibold text-marca-naranja">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-marca-naranja"
                  />
                  Solo aceptamos 1 cliente al mes en este servicio
                </p>

                <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
                  <div>
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
                  <ArrowRight
                    aria-hidden
                    className="size-6 shrink-0 text-marca-magenta transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>

              {/* Topi cierra la tarjeta del servicio estrella, como en la
                  versión anterior de esta pieza: la mascota le da cara al
                  paquete premium y el halo lo despega del fondo. */}
              <div aria-hidden className="relative hidden justify-center lg:flex">
                <div className="absolute inset-0 m-auto size-56 rounded-full bg-marca-magenta/25 blur-[80px]" />
                <Topi
                  decorativo
                  pose="parado"
                  className="relative w-full max-w-[14rem] text-white transition-transform duration-500 group-hover:-translate-y-1"
                />
              </div>
              </div>
            </Link>
          </Revelar>
        ) : null}

        <Revelar delay={180}>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Los montos son un punto de partida. Cada propuesta se cotiza a la
            medida de tu objetivo, tu mercado y tu alcance: el número final lo
            definimos juntos en la videollamada.
          </p>
        </Revelar>

        {conCierre ? (
          <Revelar delay={210} className="mt-20">
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
