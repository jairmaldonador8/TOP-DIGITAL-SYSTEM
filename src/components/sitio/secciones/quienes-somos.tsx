import { BotonCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { CERTIFICACIONES } from '@/lib/sitio/contenido'

/**
 * Quiénes somos y qué hacemos: la historia corta de la agencia, la prueba
 * de experiencia (certificaciones) y fotos reales del equipo y de los
 * proyectos. Es la sección que convierte "otra agencia más" en "estos
 * saben lo que hacen".
 */
export function QuienesSomos() {
  return (
    <section
      id="quienes-somos"
      className="border-t border-white/10 py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Revelar>
            <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Quiénes somos
            </p>
            <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
              No vendemos publicidad.
              <br />
              <span className="text-marca">Construimos negocios.</span>
            </h2>
            <div className="mt-7 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Top Digital nació hace más de cinco años con una idea simple:
                que un negocio bien hecho merece verse y venderse como lo que
                es. Empezamos resolviendo campañas para negocios locales y hoy
                somos el equipo completo de marketing, marca y tecnología de más
                de cien empresas en todo México.
              </p>
              <p>
                En el camino hemos invertido más de un millón de pesos en
                anuncios de nuestros clientes. Esa cifra no es presumir
                presupuesto: es la escuela que nos enseñó qué funciona en cada
                giro, cuánto cuesta de verdad un cliente nuevo y en qué momento
                una campaña deja de ser rentable.
              </p>
              <p>
                Trabajamos con una regla que nos ha costado clientes y nos ha
                ganado otros mejores:{' '}
                <strong className="text-foreground">
                  si no podemos ayudarte, te lo decimos en la primera llamada
                </strong>
                .
              </p>
            </div>

            <div className="mt-9">
              <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Certificaciones
              </p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {CERTIFICACIONES.map(({ nombre, detalle }) => (
                  <li
                    key={nombre}
                    className="rounded-full border border-white/12 bg-white/5 px-4 py-2"
                  >
                    <span className="text-sm font-semibold">{nombre}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {detalle}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <BotonCta />
            </div>
          </Revelar>

          <Revelar delay={120} className="grid grid-cols-2 gap-4 self-start">
            <Foto
              alt="El equipo de Top Digital"
              pie="Foto real del equipo trabajando en la oficina"
              ratio="aspect-[3/4]"
              className="col-span-1 row-span-2"
            />
            <Foto
              alt="Sesión de producción"
              pie="Foto de una grabación o sesión de fotos con cliente"
              ratio="aspect-square"
            />
            <Foto
              alt="Proyecto entregado"
              pie="Foto de un proyecto entregado (local, producto o pantalla)"
              ratio="aspect-square"
            />
          </Revelar>
        </div>
      </div>
    </section>
  )
}
