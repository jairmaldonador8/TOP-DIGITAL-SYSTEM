import { BotonCta } from '@/components/sitio/cta'
import { Foto } from '@/components/sitio/foto'
import { Revelar } from '@/components/sitio/revelar'
import { CarruselCertificaciones } from '@/components/sitio/certificaciones'

/**
 * Quiénes somos y qué hacemos. El texto va deliberadamente corto: dos
 * párrafos que sueltan las cifras que importan y cierran con la regla de
 * honestidad, porque la trayectoria ya la cuentan las certificaciones y
 * las fotos de al lado. Es la sección que convierte "otra agencia más" en
 * "estos saben lo que hacen".
 */
export function QuienesSomos() {
  return (
    <section
      id="quienes-somos"
      className="border-t border-white/10 py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* min-w-0: sin esto el item de la rejilla toma el ancho intrinseco
              del carrusel de certificaciones (3,840 px) y desborda la pagina. */}
          <Revelar className="min-w-0">
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
                Cinco años, más de cien empresas en todo México y más de un
                millón de pesos invertidos en anuncios de nuestros clientes. Esa
                cifra no es presumir presupuesto: es la escuela que nos enseñó
                qué funciona en cada giro y cuánto cuesta de verdad un cliente
                nuevo.
              </p>
              <p>
                Y una regla que nos ha costado clientes y nos ha ganado otros
                mejores:{' '}
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
              <CarruselCertificaciones />
            </div>

            <div className="mt-10">
              <BotonCta />
            </div>
          </Revelar>

          <Revelar delay={120} className="grid grid-cols-2 gap-4 self-start">
            <Foto
              src="/sitio/quienes-somos/equipo-con-cliente.webp"
              alt="Integrante de Top Digital con el cliente de MD Make Up, los dos sonriendo a la cámara"
              pie="Foto real del equipo trabajando en la oficina"
              ratio="aspect-[3/4]"
              className="col-span-1 row-span-2"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            <Foto
              src="/sitio/quienes-somos/grabacion-entrevista.webp"
              alt="Grabación de una entrevista con cliente: dos cámaras, luz de estudio y una mesa de trabajo"
              pie="Foto de una grabación o sesión de fotos con cliente"
              ratio="aspect-square"
              sizes="(min-width: 1024px) 12vw, 25vw"
            />
            <Foto
              src="/sitio/quienes-somos/sesion-en-planta.webp"
              alt="Sesión de fotos de producto en la planta de un cliente, con aro de luz y set de madera"
              pie="Foto de un proyecto entregado (local, producto o pantalla)"
              ratio="aspect-square"
              sizes="(min-width: 1024px) 12vw, 25vw"
            />
          </Revelar>
        </div>
      </div>
    </section>
  )
}
