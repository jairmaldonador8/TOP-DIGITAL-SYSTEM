import { ArrowUpRight } from 'lucide-react'

import { Newsletter } from '@/components/sitio/newsletter'
import { Revelar } from '@/components/sitio/revelar'
import { CONTENIDOS, CUENTAS } from '@/lib/sitio/redes'

/** Cada publicación se resuelve con tipografía, no con una foto que no tenemos. */
function Publicacion({
  etiqueta,
  titulo,
  formato,
  alto,
  i,
}: {
  etiqueta: string
  titulo: string
  formato: string
  alto: string
  i: number
}) {
  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-marca-magenta/50 ${alto}`}
    >
      <div
        aria-hidden
        className="bg-marca absolute -top-14 -right-10 size-44 rounded-full opacity-[0.18] blur-3xl transition-opacity group-hover:opacity-30"
      />
      <span
        aria-hidden
        className="font-heading absolute -bottom-5 right-3 text-[5rem] leading-none font-extrabold text-white/[0.04] tabular-nums select-none"
      >
        {String(i + 1).padStart(2, '0')}
      </span>

      <span className="relative w-fit rounded-full border border-white/15 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {etiqueta}
      </span>

      <div className="relative">
        <h3 className="font-heading text-lg leading-snug font-extrabold tracking-tight text-balance">
          {titulo}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">{formato}</p>
      </div>
    </article>
  )
}

/**
 * OPCIÓN A · Muro.
 *
 * Lo que publicamos, en un muro estilo feed. En vez de cuatro marcadores
 * de foto vacíos, cada pieza es una tarjeta terminada que dice qué tipo de
 * contenido va ahí — se sostiene hoy y admite la captura real después.
 */
export function RedesMuro() {
  const altos = ['h-64', 'h-52', 'h-52', 'h-64', 'h-52', 'h-64']

  return (
    <section id="redes" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Redes sociales
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Síguenos y llévate
            <span className="text-marca"> lo que sí sirve.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            Esto es lo que publicamos cada semana: consejos que puedes aplicar
            el mismo día, casos con números y el detrás de cámaras del equipo.
          </p>
        </Revelar>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENIDOS.map((c, i) => (
            <Revelar key={c.titulo} delay={(i % 3) * 70}>
              <Publicacion {...c} alto={altos[i]} i={i} />
            </Revelar>
          ))}
        </div>

        <Revelar delay={140} className="mt-12">
          <ul className="flex flex-wrap gap-2.5">
            {CUENTAS.map(({ nombre, cuenta, href }) => (
              <li key={nombre}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.03] py-3 pr-4 pl-5 transition-colors hover:border-marca-magenta/50"
                >
                  <span className="text-sm font-semibold">{nombre}</span>
                  <span className="text-xs text-muted-foreground">{cuenta}</span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 text-marca-magenta transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Revelar>

        <Revelar delay={180} className="mt-10">
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
