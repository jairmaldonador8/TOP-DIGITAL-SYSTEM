import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CierreCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { PUBLICACIONES, publicacionPorSlug } from '@/lib/sitio/contenido'

export function generateStaticParams() {
  return PUBLICACIONES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  props: PageProps<'/blog/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const post = publicacionPorSlug(slug)
  if (!post) return {}
  return { title: post.titulo, description: post.resumen }
}

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
})

export default async function PaginaPost(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const post = publicacionPorSlug(slug)
  if (!post) notFound()

  const otros = PUBLICACIONES.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <article className="pt-32 pb-24 sm:pt-40">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          ← Todos los artículos
        </Link>

        <header className="mt-8">
          <p className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            <span className="text-marca-magenta">{post.categoria}</span>
            <span aria-hidden>·</span>
            <span>{post.lectura} de lectura</span>
          </p>
          <h1 className="font-heading mt-5 text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl">
            {post.titulo}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {post.resumen}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            <time dateTime={post.fecha}>
              {FECHA.format(new Date(`${post.fecha}T12:00:00Z`))}
            </time>
          </p>
        </header>

        <div className="mt-10">
          <Foto
            alt={post.titulo}
            pie="Imagen de portada del artículo"
            ratio="aspect-[16/9]"
          />
        </div>

        <div className="mt-10 space-y-5 text-[1.05rem] leading-relaxed text-muted-foreground">
          {post.cuerpo.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-16">
          <CierreCta
            titulo={
              <>
                ¿Lo aplicamos
                <span className="text-marca"> a tu negocio?</span>
              </>
            }
            nota="Videollamada de diagnóstico, sin costo."
          />
        </div>

        {otros.length > 0 ? (
          <div className="mt-16 border-t border-white/10 pt-10">
            <h2 className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Sigue leyendo
            </h2>
            <ul className="mt-5 space-y-3">
              {otros.map((otro) => (
                <li key={otro.slug}>
                  <Link
                    href={`/blog/${otro.slug}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-marca-magenta/50"
                  >
                    <span className="block text-[0.68rem] tracking-[0.18em] text-marca-magenta uppercase">
                      {otro.categoria}
                    </span>
                    <span className="font-heading mt-1.5 block font-extrabold">
                      {otro.titulo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  )
}
