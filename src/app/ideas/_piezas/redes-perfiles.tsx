import { ArrowUpRight } from 'lucide-react'

import { Newsletter } from '@/components/sitio/newsletter'
import { Revelar } from '@/components/sitio/revelar'
import { CUENTAS } from '@/lib/sitio/redes'

/**
 * OPCIÓN B · Perfiles.
 *
 * Cada red es una tarjeta grande con el color de su propia plataforma: se
 * reconocen de un vistazo sin usar sus logos, que son marcas registradas
 * y que además ensuciarían la paleta. Es la más directa de las tres —
 * dice a dónde ir y qué vas a encontrar, sin adornos.
 */
export function RedesPerfiles() {
  return (
    <section id="redes" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Revelar>
            <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Redes sociales
            </p>
            <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
              Síguenos y llévate
              <span className="text-marca"> lo que sí sirve.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              En cada red publicamos algo distinto. Escoge la que te acomode:
              en todas vas a encontrar cosas que puedes aplicar sin
              contratarnos.
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-heading text-lg font-extrabold tracking-tight">
                Suscríbete al newsletter
              </h3>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-muted-foreground">
                Una vez al mes: lo que está funcionando en campañas, casos
                reales y recursos que puedes aplicar el mismo día.
              </p>
              <Newsletter />
            </div>
          </Revelar>

          <Revelar delay={120}>
            <ul className="grid gap-3.5 sm:grid-cols-2">
              {CUENTAS.map(({ nombre, cuenta, href, detalle, tinte }, i) => (
                <li
                  key={nombre}
                  // La primera ocupa el ancho completo: es la red donde
                  // viven las reseñas que sostienen la prueba social.
                  className={i === 0 ? 'sm:col-span-2' : ''}
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex h-full items-center justify-between gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-white/25"
                  >
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -top-16 -left-10 size-52 rounded-full bg-gradient-to-br ${tinte} opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45`}
                    />
                    <span className="relative min-w-0">
                      <span className="font-heading block text-xl font-extrabold tracking-tight">
                        {nombre}
                      </span>
                      <span className="mt-1 block truncate text-sm text-foreground/70">
                        {cuenta}
                      </span>
                      <span className="mt-3 block text-xs text-muted-foreground">
                        {detalle}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="relative size-6 shrink-0 text-white/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </Revelar>
        </div>
      </div>
    </section>
  )
}
