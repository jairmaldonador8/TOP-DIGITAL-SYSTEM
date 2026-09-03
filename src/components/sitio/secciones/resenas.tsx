import { Star } from 'lucide-react'

import { Revelar } from '@/components/sitio/revelar'
import { CONTACTO, type Resena } from '@/lib/sitio/contenido'
import { obtenerResenas } from '@/lib/sitio/resenas-google'

/**
 * Prueba social: las reseñas de los clientes en carrusel continuo.
 *
 * Dos pistas que corren en sentidos opuestos y no se detienen — el mismo
 * lenguaje "siempre encendidos" del resto del sitio. Se pausan al pasar
 * el cursor para poder leer, y con movimiento reducido se quedan quietas.
 *
 * El bucle se logra duplicando la lista y moviendo la pista un −50%: al
 * llegar ahí, la segunda copia queda exactamente donde arrancó la
 * primera, así que el salto es invisible.
 */

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
              ? 'fill-marca-naranja text-marca-naranja size-3.5'
              : 'size-3.5 text-white/20'
          }
        />
      ))}
    </div>
  )
}

/** Sello de la plataforma donde se dejó la reseña. */
function SelloFuente({ fuente }: { fuente: Resena['fuente'] }) {
  if (fuente === 'google') {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[0.7rem] font-bold text-[#4285F4]"
        title="Reseña de Google"
      >
        G
      </span>
    )
  }
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-[0.7rem] font-bold text-white"
      title="Reseña de Facebook"
    >
      f
    </span>
  )
}

function Tarjeta({ resena }: { resena: Resena }) {
  const inicial = resena.autor.trim().charAt(0).toUpperCase()
  return (
    <figure className="flex w-[19rem] shrink-0 flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:w-[22rem]">
      <div className="flex items-center justify-between gap-3">
        <Estrellas cantidad={resena.estrellas} />
        <SelloFuente fuente={resena.fuente} />
      </div>

      <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-foreground/90">
        {'“'}
        {resena.texto}
        {'”'}
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
        <span className="bg-marca flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          {inicial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {resena.autor}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {[resena.negocio, resena.fecha].filter(Boolean).join(' · ')}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

function Pista({
  resenas,
  reversa,
  segundos,
}: {
  resenas: Resena[]
  reversa?: boolean
  segundos: number
}) {
  return (
    <div
      className={'pista flex w-max ' + (reversa ? 'pista-reversa' : '')}
      style={{ animationDuration: segundos + 's' }}
    >
      {/* Dos copias: la segunda es la que hace invisible el salto. El
          espacio entre tarjetas vive DENTRO de cada copia (incluido el de
          la orilla, vía `pr-5`) y no como `gap` del contenedor: si no, ese
          hueco no entra en el −50% y el bucle salta unos pixeles. */}
      {[0, 1].map((copia) => (
        <div
          key={copia}
          className="flex shrink-0 gap-5 pr-5"
          aria-hidden={copia === 1}
        >
          {resenas.map((r, i) => (
            <Tarjeta key={i} resena={r} />
          ))}
        </div>
      ))}
    </div>
  )
}

export async function Resenas() {
  const { resenas, promedio, total, esPlantilla } = await obtenerResenas()

  // Se reparten en dos pistas para que corran en sentidos opuestos. Con
  // pocas reseñas se usa la misma lista en ambas, desfasada.
  const mitad = Math.ceil(resenas.length / 2)
  const arriba = resenas.length >= 4 ? resenas.slice(0, mitad) : resenas
  const abajo =
    resenas.length >= 4 ? resenas.slice(mitad) : [...resenas].reverse()

  return (
    <section id="resenas" className="overflow-hidden border-t border-white/10 py-20 sm:py-28">
      <style>{`
        @keyframes correr-resenas { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pista { animation: correr-resenas linear infinite; }
        .pista-reversa { animation-direction: reverse; }
        .carrusel:hover .pista { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .pista { animation: none; } }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Revelar className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Lo que dicen de nosotros
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Cinco estrellas que no
            <span className="text-marca"> nos pusimos solos.</span>
          </h2>

          {promedio !== null && (
            <p className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Estrellas cantidad={Math.round(promedio)} />
              <span>
                <strong className="text-foreground">
                  {promedio.toFixed(1)}
                </strong>{' '}
                de promedio
                {total !== null ? ` en ${total} reseñas de Google` : ''}
              </span>
            </p>
          )}
        </Revelar>
      </div>

      {/* Las pistas salen del contenedor a propósito: el carrusel corre de
          borde a borde y se desvanece en las orillas. */}
      <div
        className="carrusel mt-12 flex flex-col gap-5 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
        aria-label="Reseñas de clientes"
      >
        <Pista resenas={arriba} segundos={52} />
        <Pista resenas={abajo} reversa segundos={64} />
      </div>

      <div className="mx-auto mt-10 w-full max-w-7xl px-5 sm:px-8">
        <a
          href={CONTACTO.facebookResenas}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
        >
          Ver todas las reseñas
          <span aria-hidden>→</span>
        </a>
        {esPlantilla && (
          <p className="mt-3 text-xs text-muted-foreground/60">
            {/* Aviso solo visible mientras no haya datos reales conectados. */}
            Reseñas de ejemplo: falta conectar la ficha de Google.
          </p>
        )}
      </div>
    </section>
  )
}
