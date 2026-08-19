import { Star } from 'lucide-react'

import { Revelar } from '@/components/sitio/revelar'
import { CONTACTO, RESENAS } from '@/lib/sitio/contenido'

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${cantidad} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={
            i < cantidad
              ? 'size-4 fill-marca-naranja text-marca-naranja'
              : 'size-4 text-white/20'
          }
        />
      ))}
    </div>
  )
}

/** Prueba social: las reseñas que los clientes dejaron en Facebook. */
export function Resenas() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Lo que dicen de nosotros
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Cinco estrellas que no
            <span className="text-marca"> nos pusimos solos.</span>
          </h2>
        </Revelar>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {RESENAS.map((resena, i) => (
            <Revelar key={i} delay={i * 90}>
              <figure className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <Estrellas cantidad={resena.estrellas} />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-foreground/90">
                  “{resena.texto}”
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-5">
                  <span className="block text-sm font-semibold">
                    {resena.autor}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {resena.negocio}
                  </span>
                </figcaption>
              </figure>
            </Revelar>
          ))}
        </div>

        <Revelar delay={200}>
          <a
            href={CONTACTO.facebookResenas}
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Ver todas las reseñas en Facebook
            <span aria-hidden>→</span>
          </a>
        </Revelar>
      </div>
    </section>
  )
}
