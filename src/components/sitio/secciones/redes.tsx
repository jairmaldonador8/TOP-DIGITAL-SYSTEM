import { ArrowUpRight } from 'lucide-react'

import { Foto } from '@/components/sitio/foto'
import { Newsletter } from '@/components/sitio/newsletter'
import { Revelar } from '@/components/sitio/revelar'
import { CONTACTO } from '@/lib/sitio/contenido'

const REDES = [
  { nombre: 'Instagram', href: CONTACTO.instagram, detalle: 'Consejos y detrás de cámaras' },
  { nombre: 'Facebook', href: CONTACTO.facebook, detalle: 'Casos y reseñas de clientes' },
  { nombre: 'TikTok', href: CONTACTO.tiktok, detalle: 'Tips rápidos de marketing' },
  { nombre: 'LinkedIn', href: CONTACTO.linkedin, detalle: 'Estrategia para empresas' },
  { nombre: 'YouTube', href: CONTACTO.youtube, detalle: 'Tutoriales y casos a fondo' },
]

/**
 * Cierre del sitio: lo que publicamos y la invitación al newsletter. Es la
 * salida para quien todavía no quiere agendar pero sí quedarse cerca.
 */
export function Redes() {
  return (
    <section id="redes" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Revelar>
            <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Redes sociales
            </p>
            <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
              Síguenos y llévate
              <span className="text-marca"> lo que sí sirve.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Ahí publicamos consejos prácticos, recomendaciones y de paso te
              entretienes un rato con información útil para tu empresa.
            </p>

            <ul className="mt-9 space-y-2.5">
              {REDES.map(({ nombre, href, detalle }) => (
                <li key={nombre}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 transition-colors hover:border-marca-magenta/50"
                  >
                    <span>
                      <span className="block font-semibold">{nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        {detalle}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 shrink-0 text-marca-magenta transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </a>
                </li>
              ))}
            </ul>

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

          <Revelar delay={120} className="grid grid-cols-2 gap-4 self-start">
            {[
              'Captura de un reel o publicación reciente',
              'Captura de una publicación con buen alcance',
              'Captura de un carrusel de consejos',
              'Captura de una historia con resultados',
            ].map((pie, i) => (
              <Foto
                key={pie}
                alt="Publicación de Top Digital"
                pie={pie}
                ratio={i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-square'}
              />
            ))}
          </Revelar>
        </div>
      </div>
    </section>
  )
}
