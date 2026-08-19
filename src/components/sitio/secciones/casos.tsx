import Link from 'next/link'

import { CierreCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { CASOS } from '@/lib/sitio/contenido'
import { servicioPorSlug } from '@/lib/sitio/servicios'

/**
 * Casos de éxito: foto real del cliente, qué se realizó y los números que
 * dejó. Cierra con la pregunta que empuja a agendar.
 */
export function Casos({ conCierre = true }: { conCierre?: boolean }) {
  return (
    <section id="casos" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Casos de éxito
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Negocios reales,
            <span className="text-marca"> números reales.</span>
          </h2>
        </Revelar>

        <div className="mt-12 space-y-5">
          {CASOS.map((caso, i) => (
            <Revelar key={caso.slug} delay={i * 90}>
              <article className="grid items-center gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
                <Foto
                  src={caso.imagen || undefined}
                  alt={`Proyecto de ${caso.cliente}`}
                  pie="Foto real del cliente o del proyecto entregado"
                  ratio="aspect-[4/3]"
                />

                <div>
                  <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                    {caso.giro}
                  </p>
                  <h3 className="font-heading mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {caso.cliente}
                  </h3>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {caso.servicios.map((slug) => {
                      const servicio = servicioPorSlug(slug)
                      if (!servicio) return null
                      return (
                        <li key={slug}>
                          <Link
                            href={`/servicios/${slug}`}
                            className="inline-block rounded-full border border-white/12 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-marca-magenta/60 hover:text-white"
                          >
                            {servicio.etiqueta}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>

                  <dl className="mt-6 space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold">El reto</dt>
                      <dd className="mt-1 text-muted-foreground">{caso.reto}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Lo que hicimos</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {caso.hicimos}
                      </dd>
                    </div>
                  </dl>

                  <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                    {caso.resultados.map(({ cifra, etiqueta }) => (
                      <div key={etiqueta}>
                        <dt className="sr-only">{etiqueta}</dt>
                        <dd>
                          <span className="text-marca font-heading block text-2xl font-extrabold tracking-tight sm:text-3xl">
                            {cifra}
                          </span>
                          <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                            {etiqueta}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Revelar>
          ))}
        </div>

        {conCierre ? (
          <Revelar delay={150} className="mt-20">
            <CierreCta
              titulo={
                <>
                  ¿Qué esperas para ser tú
                  <br className="hidden sm:block" /> el
                  <span className="text-marca"> próximo caso de éxito</span>?
                </>
              }
              nota="Videollamada de 30 minutos, sin costo y sin compromiso."
            />
          </Revelar>
        ) : null}
      </div>
    </section>
  )
}
