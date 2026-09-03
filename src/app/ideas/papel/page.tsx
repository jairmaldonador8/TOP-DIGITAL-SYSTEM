import { Fraunces } from 'next/font/google'
import { ArrowUpRight } from 'lucide-react'

import { Topi, Wordmark } from '@/components/sitio/marca'
import { METRICAS, RESENAS } from '@/lib/sitio/contenido'
import { SERVICIOS } from '@/lib/sitio/servicios'

/**
 * IDEA "PAPEL" — editorial, sobre fondo claro.
 *
 * La apuesta: que Top Digital no se vea como una agencia de anuncios sino
 * como un estudio con criterio. Papel hueso, tinta casi negra, una serif
 * de alto contraste para lo que se lee y Poppins solo para lo funcional.
 * El degradado de marca deja de bañar la página y pasa a ser tinta cara:
 * aparece contadas veces y nada más. El peso lo cargan el aire y las
 * reglas finas, no los brillos.
 */
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap' })

const PAPEL = '#efebe3'
const CREMA = '#e7e2d8'
const TINTA = '#17141c'
const LINEA = 'rgba(23,20,28,0.14)'

export default function IdeaPapel() {
  return (
    <div
      className={fraunces.className + ' min-h-svh'}
      style={{ backgroundColor: PAPEL, color: TINTA }}
    >
      <Cabecera />
      <Portada />
      <Cifras />
      <Manifiesto />
      <Indice />
      <Voces />
      <Cierre />
    </div>
  )
}

function Cabecera() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ borderColor: LINEA, backgroundColor: 'rgba(239,235,227,0.9)' }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
        <Wordmark className="h-6 w-auto invert" />
        <nav className="hidden gap-9 font-sans text-[0.68rem] font-semibold tracking-[0.16em] uppercase md:flex">
          {['Servicios', 'Casos', 'Estudio', 'Diario'].map((t) => (
            <span key={t} className="cursor-default opacity-60">
              {t}
            </span>
          ))}
        </nav>
        <span
          className="rounded-full px-5 py-2 font-sans text-[0.7rem] font-semibold tracking-wide text-white"
          style={{ backgroundColor: TINTA }}
        >
          Agendar diagnóstico
        </span>
      </div>
    </header>
  )
}

function Portada() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-14 px-6 pt-20 pb-24 lg:grid-cols-[1fr_20rem] lg:px-10 lg:pt-28">
      <div>
        <p className="font-sans text-[0.66rem] font-semibold tracking-[0.24em] uppercase opacity-45">
          Marca · Marketing · Tecnología — Puebla, México
        </p>

        <h1 className="mt-8 text-[3.4rem] leading-[0.86] font-normal tracking-[-0.03em] text-balance sm:text-[5rem] lg:text-[6.4rem]">
          Somos resultados{' '}
          <span className="text-marca font-black italic">TOP</span>
          <br />
          en lo <span className="text-marca font-black italic">DIGITAL</span>
        </h1>

        <div
          className="mt-12 grid max-w-2xl gap-7 border-t pt-8 font-sans sm:grid-cols-[1fr_auto] sm:items-end"
          style={{ borderColor: LINEA }}
        >
          <p className="text-[0.95rem] leading-relaxed opacity-70">
            Marca, sitio, campañas y tecnología trabajando juntos para que tu
            empresa consiga clientes mes tras mes. Te decimos qué te está
            frenando en una videollamada, sin costo y sin compromiso.
          </p>
          <span
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white"
            style={{ backgroundColor: TINTA }}
          >
            Ver el diagnóstico
            <ArrowUpRight aria-hidden className="size-4" />
          </span>
        </div>
      </div>

      {/* Bloque de tinta: el único lugar oscuro de la portada. Corta el
          papel con un peso sólido y le da a Topi dónde vivir. */}
      <aside
        className="relative flex min-h-[24rem] flex-col justify-between overflow-hidden rounded-[2rem] p-8 text-white"
        style={{ backgroundColor: TINTA }}
      >
        <p className="font-sans text-[0.62rem] font-semibold tracking-[0.22em] uppercase opacity-50">
          Solo 1 cliente premium al mes
        </p>
        <Topi
          decorativo
          className="pointer-events-none absolute -right-14 -bottom-12 h-72 w-auto"
        />
        <p className="relative text-3xl leading-none">
          siempre
          <br />
          encendidos<span className="text-marca">.</span>
        </p>
      </aside>
    </section>
  )
}

function Cifras() {
  return (
    <section
      className="border-y"
      style={{ borderColor: LINEA, backgroundColor: CREMA }}
    >
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 px-6 lg:grid-cols-4 lg:px-10">
        {METRICAS.map(({ cifra, unidad, etiqueta }, i) => (
          <div
            key={etiqueta}
            className="border-b py-9 lg:border-b-0 lg:py-11"
            style={{
              borderColor: LINEA,
              borderLeft: i === 0 ? undefined : '1px solid ' + LINEA,
              paddingLeft: i === 0 ? undefined : '1.5rem',
            }}
          >
            <dd className="text-[2.6rem] leading-none tracking-tight lg:text-5xl">
              {cifra}
              <span className="ml-1.5 font-sans text-xs font-semibold opacity-45">
                {unidad}
              </span>
            </dd>
            <dt className="mt-3 font-sans text-[0.7rem] tracking-wide opacity-55">
              {etiqueta}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Manifiesto() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-28 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[8rem_1fr]">
        <p className="font-sans text-[0.62rem] font-semibold tracking-[0.22em] uppercase opacity-45">
          El estudio
        </p>
        <p className="max-w-3xl text-[1.9rem] leading-[1.25] tracking-[-0.015em] text-balance sm:text-[2.6rem]">
          No vendemos piezas sueltas. Ordenamos lo que ya tienes, lo conectamos
          y lo medimos — <em className="text-marca">hasta que el teléfono suena</em>.
        </p>
      </div>
    </section>
  )
}

function Indice() {
  return (
    <section className="border-t" style={{ borderColor: LINEA }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-10">
        <h2 className="font-sans text-[0.62rem] font-semibold tracking-[0.22em] uppercase opacity-45">
          Índice de servicios
        </h2>

        <ul className="mt-10">
          {SERVICIOS.map((s, i) => (
            <li key={s.slug} className="group border-t" style={{ borderColor: LINEA }}>
              <div className="grid items-baseline gap-2 py-7 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-6">
                <span className="font-sans text-[0.7rem] font-semibold tabular-nums opacity-40">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-2xl tracking-tight transition-transform duration-300 group-hover:translate-x-1.5 sm:text-3xl">
                    {s.nombre}
                  </h3>
                  <p className="mt-1.5 font-sans text-sm opacity-55">{s.frase}</p>
                </div>
                <span className="font-sans text-sm whitespace-nowrap opacity-70">
                  desde ${s.desde.toLocaleString('es-MX')}
                  {s.periodo === 'mes' ? ' / mes' : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Voces() {
  return (
    <section
      className="border-t"
      style={{ borderColor: LINEA, backgroundColor: CREMA }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-3 lg:px-10">
        {RESENAS.map((r, i) => (
          <figure key={i} className="flex flex-col gap-5">
            <p className="text-marca font-sans text-xs tracking-[0.2em]">
              {'★'.repeat(r.estrellas)}
            </p>
            <blockquote className="text-xl leading-snug tracking-tight">
              {r.texto}
            </blockquote>
            <figcaption className="mt-auto font-sans text-xs opacity-55">
              {r.autor} — {r.negocio}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Cierre() {
  return (
    <section className="px-6 pt-20 pb-32 lg:px-10">
      <div
        className="mx-auto flex w-full max-w-6xl flex-col items-start gap-9 rounded-[2.5rem] px-8 py-20 text-white sm:px-16"
        style={{ backgroundColor: TINTA }}
      >
        <p className="font-sans text-[0.62rem] font-semibold tracking-[0.22em] uppercase opacity-50">
          Videollamada de diagnóstico
        </p>
        <h2 className="max-w-3xl text-[2.6rem] leading-[0.95] tracking-[-0.02em] text-balance sm:text-6xl">
          Cuéntanos qué pasa. Te decimos <em className="text-marca">qué hacer</em>.
        </h2>
        <span className="bg-marca inline-flex items-center gap-2 rounded-full px-7 py-4 font-sans text-sm font-bold">
          Agendar mi videollamada gratis
          <ArrowUpRight aria-hidden className="size-4" />
        </span>
      </div>
    </section>
  )
}
