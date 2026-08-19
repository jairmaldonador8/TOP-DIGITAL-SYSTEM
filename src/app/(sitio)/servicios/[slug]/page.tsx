import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'

import { BotonCta, CierreCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { CASOS } from '@/lib/sitio/contenido'
import { precioMxn, SERVICIOS, servicioPorSlug } from '@/lib/sitio/servicios'

export function generateStaticParams() {
  return SERVICIOS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata(
  props: PageProps<'/servicios/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const servicio = servicioPorSlug(slug)
  if (!servicio) return {}
  return {
    title: servicio.nombre,
    description: `${servicio.frase} ${servicio.solucion.slice(0, 120)}…`,
  }
}

export default async function PaginaServicio(
  props: PageProps<'/servicios/[slug]'>
) {
  const { slug } = await props.params
  const servicio = servicioPorSlug(slug)
  if (!servicio) notFound()

  // Proyectos donde entregamos este servicio.
  const casos = CASOS.filter((c) => c.servicios.includes(servicio.slug))
  const otros = SERVICIOS.filter((s) => s.slug !== servicio.slug).slice(0, 3)

  return (
    <>
      {/* Portada del servicio */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-32 size-[32rem] rounded-full bg-marca-violeta/18 blur-[150px]"
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Link
            href="/servicios"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            ← Todos los servicios
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {servicio.etiqueta}
              </p>
              <h1 className="font-heading mt-5 text-3xl leading-[1.03] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {servicio.frase}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {servicio.problema}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <BotonCta />
                <p className="text-sm">
                  <span className="block text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
                    Desde
                  </span>
                  <span className="font-heading text-xl font-extrabold">
                    {precioMxn(servicio.desde)}
                    {servicio.periodo === 'mes' ? (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {' '}
                        / mes
                      </span>
                    ) : null}
                  </span>
                </p>
              </div>
            </div>

            <Foto
              alt={`Portada de ${servicio.nombre}`}
              pie={`Portada profesional del servicio: ${servicio.etiqueta}`}
              ratio="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Lo que cuesta no resolverlo */}
      <section className="border-t border-white/10 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Revelar className="max-w-3xl">
            <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-marca-naranja uppercase">
              Lo que te está costando
            </p>
            <p className="font-heading mt-5 text-xl leading-snug font-bold text-balance sm:text-3xl">
              {servicio.costo}
            </p>
          </Revelar>
        </div>
      </section>

      {/* Cómo lo resolvemos + proceso */}
      <section className="border-t border-white/10 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <Revelar>
              <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Cómo lo resolvemos
              </p>
              <h2 className="font-heading mt-5 text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
                De forma profesional, eficaz y eficiente.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                {servicio.solucion}
              </p>

              <div className="mt-10">
                <Foto
                  alt={`Demo del servicio ${servicio.etiqueta}`}
                  pie="Video demo del servicio (VSL): muy visual, atractivo y profesional"
                  ratio="aspect-video"
                />
              </div>
            </Revelar>

            <Revelar delay={120}>
              <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                El proceso
              </p>
              <ol className="mt-6 space-y-0">
                {servicio.proceso.map((etapa, i) => (
                  <li key={etapa.paso} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className="bg-marca flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      >
                        {i + 1}
                      </span>
                      {i < servicio.proceso.length - 1 ? (
                        <span
                          aria-hidden
                          className="w-px flex-1 bg-gradient-to-b from-white/25 to-white/5"
                        />
                      ) : null}
                    </div>
                    <div className="pb-8">
                      <h3 className="font-heading text-lg font-extrabold tracking-tight">
                        {etapa.paso}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {etapa.detalle}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Revelar>
          </div>
        </div>
      </section>

      {/* Entregables y resultados */}
      <section className="border-t border-white/10 py-20 sm:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <Revelar>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              Qué incluye
            </h2>
            <ul className="mt-7 space-y-3.5">
              {servicio.entregables.map((e) => (
                <li key={e} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="bg-marca mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="size-3 text-white" />
                  </span>
                  <span className="leading-relaxed text-muted-foreground">
                    {e}
                  </span>
                </li>
              ))}
            </ul>
          </Revelar>

          <Revelar delay={120}>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              Resultados que vas a obtener
            </h2>
            <ul className="mt-7 space-y-4">
              {servicio.resultados.map((r) => (
                <li
                  key={r}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-[1.05rem] leading-snug font-semibold"
                >
                  {r}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                Inversión
              </p>
              <p className="font-heading mt-3 text-3xl font-extrabold tracking-tight">
                Desde {precioMxn(servicio.desde)}
                {servicio.periodo === 'mes' ? (
                  <span className="text-lg font-semibold text-muted-foreground">
                    {' '}
                    / mes
                  </span>
                ) : null}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Los montos son un punto de partida. Cada propuesta se cotiza a
                la medida de tu objetivo, mercado y alcance — el número final lo
                definimos juntos en la llamada.
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      {/* Proyectos de este servicio */}
      {casos.length > 0 ? (
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <Revelar>
              <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Proyectos de {servicio.etiqueta}
              </p>
              <h2 className="font-heading mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Lo que hemos entregado
              </h2>
            </Revelar>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {casos.map((caso, i) => (
                <Revelar key={caso.slug} delay={i * 80}>
                  <li className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <Foto
                      src={caso.imagen || undefined}
                      alt={`Proyecto de ${caso.cliente}`}
                      pie="Foto del proyecto entregado"
                      ratio="aspect-[4/3]"
                      className="rounded-none border-0 border-b border-white/10"
                    />
                    <div className="p-6">
                      <p className="text-[0.68rem] tracking-[0.2em] text-muted-foreground uppercase">
                        {caso.giro}
                      </p>
                      <h3 className="font-heading mt-2 text-lg font-extrabold tracking-tight">
                        {caso.cliente}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                        {caso.hicimos}
                      </p>
                    </div>
                  </li>
                </Revelar>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Cierre + otros servicios */}
      <section className="border-t border-white/10 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Revelar>
            <CierreCta
              titulo={
                <>
                  ¿Listo para resolver esto
                  <span className="text-marca"> de una vez?</span>
                </>
              }
              nota="Agenda tu videollamada de diagnóstico, sin costo."
            />
          </Revelar>

          <Revelar delay={150} className="mt-20">
            <h2 className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Otros servicios
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {otros.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/servicios/${s.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-marca-magenta/50"
                  >
                    <span className="font-semibold">{s.etiqueta}</span>
                    <ArrowRight
                      aria-hidden
                      className="size-4 shrink-0 text-marca-magenta transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Revelar>
        </div>
      </section>
    </>
  )
}
