import Link from 'next/link'

import { FirmaEstudio, Lockup } from '@/components/sitio/marca'
import { CONTACTO } from '@/lib/sitio/contenido'
import { URL_LOGIN } from '@/lib/sitio/plataforma'
import { SERVICIOS } from '@/lib/sitio/servicios'

const REDES = [
  { href: CONTACTO.facebook, texto: 'Facebook' },
  { href: CONTACTO.instagram, texto: 'Instagram' },
  { href: CONTACTO.tiktok, texto: 'TikTok' },
  { href: CONTACTO.linkedin, texto: 'LinkedIn' },
  { href: CONTACTO.youtube, texto: 'YouTube' },
]

export function FooterSitio() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Lockup className="h-11 w-auto text-white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Marketing, marca y tecnología que se miden. Somos el equipo que
              tu empresa necesita para crecer mes tras mes.
            </p>
            <p className="mt-6 text-lg font-extrabold lowercase">
              siempre encendidos<span className="text-marca">.</span>
            </p>
          </div>

          <nav aria-labelledby="pie-servicios">
            <h2
              id="pie-servicios"
              className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase"
            >
              Servicios
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SERVICIOS.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/servicios/${s.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-white"
                  >
                    {s.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="pie-sitio">
            <h2
              id="pie-sitio"
              className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase"
            >
              Sitio
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: '/', texto: 'Inicio' },
                { href: '/casos', texto: 'Casos de éxito' },
                { href: '/blog', texto: 'Blog' },
                { href: '/redes', texto: 'Redes sociales' },
                { href: '/agendar', texto: 'Agendar diagnóstico' },
                { href: URL_LOGIN, texto: 'Iniciar sesión' },
              ].map(({ href, texto }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-white"
                  >
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Contacto
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={`https://wa.me/${CONTACTO.whatsapp}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-white"
                >
                  {CONTACTO.whatsappVisible}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACTO.correo}`}
                  className="text-sm break-all text-muted-foreground transition-colors hover:text-white"
                >
                  {CONTACTO.correo}
                </a>
              </li>
            </ul>
            <h2 className="mt-8 text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Redes
            </h2>
            <ul className="mt-4 space-y-2.5">
              {REDES.map(({ href, texto }) => (
                <li key={texto}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-white"
                  >
                    {texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Top Digital. Todos los derechos
            reservados.
          </p>
          <p className="flex items-center gap-2.5">
            <span>Identidad y sitio por</span>
            <FirmaEstudio className="h-[0.9rem] w-auto opacity-70 transition-opacity hover:opacity-100 sm:h-4" />
          </p>
        </div>
      </div>
    </footer>
  )
}
