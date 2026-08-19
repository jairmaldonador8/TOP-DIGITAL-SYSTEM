import type { Metadata } from 'next'
import Link from 'next/link'

import { CierreCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { PUBLICACIONES } from '@/lib/sitio/contenido'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Consejos prácticos de marketing, marca y tecnología para empresas mexicanas que quieren crecer.',
}

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
})

export default function PaginaBlog() {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Blog
          </p>
          <h1 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Lo que aprendemos
            <span className="text-marca"> lo compartimos.</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Consejos prácticos, recomendaciones y lo que sí está funcionando
            hoy — con datos de campañas reales, no teoría.
          </p>
        </Revelar>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLICACIONES.map((post, i) => (
            <Revelar key={post.slug} delay={(i % 3) * 80}>
              <li className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-marca-magenta/50"
                >
                  <Foto
                    alt={post.titulo}
                    pie="Imagen de portada del artículo"
                    ratio="aspect-[16/10]"
                    className="rounded-none border-0 border-b border-white/10"
                  />
                  <div className="flex flex-1 flex-col p-7">
                    <p className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
                      <span className="text-marca-magenta">{post.categoria}</span>
                      <span aria-hidden>·</span>
                      <span>{post.lectura}</span>
                    </p>
                    <h2 className="font-heading mt-3 text-lg leading-snug font-extrabold tracking-tight">
                      {post.titulo}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {post.resumen}
                    </p>
                    <p className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
                      {FECHA.format(new Date(`${post.fecha}T12:00:00Z`))}
                    </p>
                  </div>
                </Link>
              </li>
            </Revelar>
          ))}
        </ul>

        <Revelar delay={150} className="mt-20">
          <CierreCta
            titulo={
              <>
                ¿Mejor que te lo digamos
                <span className="text-marca"> aplicado a tu negocio?</span>
              </>
            }
            nota="Videollamada de diagnóstico, sin costo."
          />
        </Revelar>
      </div>
    </div>
  )
}
