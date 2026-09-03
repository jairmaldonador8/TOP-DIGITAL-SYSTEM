import { Archivo_Black } from 'next/font/google'
import { ArrowRight } from 'lucide-react'

import { Topi, Wordmark } from '@/components/sitio/marca'
import { METRICAS, PROBLEMAS } from '@/lib/sitio/contenido'
import { SERVICIOS } from '@/lib/sitio/servicios'

/**
 * IDEA "BLOQUES" — cartel, ruidoso, sin miedo.
 *
 * Aquí el degradado se rompe en sus tres tonos y cada uno toma una franja
 * completa de la página. Nada de radios, nada de sombras, nada de vidrio:
 * bordes negros de 3px, mayúsculas apretadas y Topi entrando por la
 * orilla. Es la dirección que se ve desde el otro lado de la calle — la
 * apuesta es memoria, no elegancia.
 */
const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', display: 'swap' })

const VIOLETA = '#7c3aed'
const MAGENTA = '#f0338d'
const NARANJA = '#fca044'
const NEGRO = '#0d0b10'
const HUESO = '#f4f1ec'

export default function IdeaBloques() {
  return (
    <div style={{ backgroundColor: HUESO, color: NEGRO }}>
      <style>{`
        @keyframes desfile { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .desfile { animation: desfile 26s linear infinite }
        @media (prefers-reduced-motion: reduce) { .desfile { animation: none } }
      `}</style>

      <Barra />
      <Portada />
      <Desfile />
      <Cifras />
      <Catalogo />
      <Dolores />
      <Cierre />
    </div>
  )
}

function Barra() {
  return (
    <header
      className="sticky top-0 z-40 border-b-[3px]"
      style={{ backgroundColor: NEGRO, borderColor: NEGRO }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Wordmark className="h-6 w-auto" />
        <nav
          className={
            archivo.className +
            ' hidden gap-7 text-[0.7rem] tracking-[0.06em] text-white uppercase md:flex'
          }
        >
          {['Servicios', 'Casos', 'Blog', 'Redes'].map((t) => (
            <span key={t} className="cursor-default">
              {t}
            </span>
          ))}
        </nav>
        <span
          className={
            archivo.className +
            ' border-[3px] px-4 py-2 text-[0.72rem] uppercase'
          }
          style={{ backgroundColor: NARANJA, borderColor: HUESO, color: NEGRO }}
        >
          Diagnóstico gratis
        </span>
      </div>
    </header>
  )
}

function Portada() {
  return (
    <section
      className="relative overflow-hidden border-b-[3px]"
      style={{ backgroundColor: VIOLETA, borderColor: NEGRO }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 pb-0 lg:px-8 lg:pt-24">
        <span
          className={
            archivo.className +
            ' inline-block -rotate-2 border-[3px] px-3 py-1.5 text-[0.7rem] uppercase'
          }
          style={{ backgroundColor: NARANJA, borderColor: NEGRO }}
        >
          Agencia de marketing, marca y tecnología
        </span>

        <h1
          className={
            archivo.className +
            ' mt-8 text-[clamp(1.95rem,8.4vw,3.3rem)] leading-[0.8] tracking-[-0.035em] text-white uppercase sm:text-[6rem] lg:text-[8.5rem]'
          }
        >
          Somos
          <br />
          resultados{' '}
          <span
            style={{
              color: NARANJA,
              WebkitTextStroke: '3px ' + NEGRO,
              paintOrder: 'stroke fill',
            }}
          >
            top
          </span>
          <br />
          en lo{' '}
          <span
            style={{
              color: MAGENTA,
              WebkitTextStroke: '3px ' + NEGRO,
              paintOrder: 'stroke fill',
            }}
          >
            digital
          </span>
        </h1>

        <div className="grid items-end gap-8 pt-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-lg pb-12">
            <p className="text-[0.95rem] leading-relaxed font-medium text-white/90">
              Marca, sitio, campañas y tecnología trabajando juntos para que tu
              empresa consiga clientes mes tras mes. Te decimos qué te está
              frenando en una videollamada, sin costo y sin compromiso.
            </p>
            <span
              className={
                archivo.className +
                ' mt-7 inline-flex items-center gap-2.5 border-[3px] px-6 py-4 text-sm uppercase'
              }
              style={{ backgroundColor: HUESO, borderColor: NEGRO, color: NEGRO }}
            >
              Agendar videollamada
              <ArrowRight aria-hidden className="size-4" strokeWidth={3} />
            </span>
          </div>

          {/* Topi entra por la orilla y la rompe: es el gesto de la campaña. */}
          <Topi
            decorativo
            className="pointer-events-none -mb-1 h-[19rem] w-auto justify-self-end sm:h-[26rem] lg:h-[30rem]"
          />
        </div>
      </div>
    </section>
  )
}

function Desfile() {
  const frase = 'siempre encendidos'
  const tira = Array.from({ length: 8 })
  return (
    <div
      className="overflow-hidden border-b-[3px] py-3"
      style={{ backgroundColor: NEGRO, borderColor: NEGRO }}
    >
      <div className="desfile flex w-max">
        {[0, 1].map((v) => (
          <div key={v} className="flex shrink-0">
            {tira.map((_, i) => (
              <span
                key={i}
                className={
                  archivo.className +
                  ' flex items-center gap-6 px-6 text-lg text-white uppercase'
                }
              >
                {frase}
                <span style={{ color: MAGENTA }}>★</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Cifras() {
  const fondos = [MAGENTA, HUESO, NARANJA, HUESO]
  return (
    <dl className="grid border-b-[3px] sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: NEGRO }}>
      {METRICAS.map(({ cifra, unidad, etiqueta }, i) => (
        <div
          key={etiqueta}
          className="border-b-[3px] px-6 py-10 last:border-b-0 sm:border-r-[3px] lg:border-b-0"
          style={{ backgroundColor: fondos[i], borderColor: NEGRO }}
        >
          <dd
            className={
              archivo.className + ' text-5xl leading-none tracking-[-0.04em] lg:text-6xl'
            }
          >
            {cifra}
            <span className="ml-1 align-super text-base">{unidad}</span>
          </dd>
          <dt className="mt-3 text-sm font-semibold">{etiqueta}</dt>
        </div>
      ))}
    </dl>
  )
}

function Catalogo() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8">
      <h2
        className={
          archivo.className +
          ' text-[clamp(1.8rem,7.4vw,2.4rem)] leading-[0.85] tracking-[-0.035em] uppercase sm:text-6xl'
        }
      >
        Cada servicio
        <br />
        resuelve un{' '}
        <span style={{ color: MAGENTA }}>problema</span> concreto
      </h2>

      <div className="mt-12 grid gap-0 border-[3px] sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: NEGRO }}>
        {SERVICIOS.map((s, i) => (
          <article
            key={s.slug}
            className="flex min-h-56 flex-col justify-between gap-6 border-b-[3px] p-6 last:border-b-0 sm:border-r-[3px]"
            style={{
              borderColor: NEGRO,
              backgroundColor: i % 3 === 0 ? NEGRO : HUESO,
              color: i % 3 === 0 ? HUESO : NEGRO,
            }}
          >
            <div>
              <p className={archivo.className + ' text-xs opacity-45'}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className={archivo.className + ' mt-3 text-xl uppercase'}>
                {s.etiqueta}
              </h3>
              <p className="mt-2.5 text-sm leading-snug opacity-70">{s.frase}</p>
            </div>
            <p className={archivo.className + ' text-lg'} style={{ color: i % 3 === 0 ? NARANJA : VIOLETA }}>
              ${s.desde.toLocaleString('es-MX')}
              <span className="text-xs opacity-60">
                {s.periodo === 'mes' ? '/mes' : ''}
              </span>
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Dolores() {
  return (
    <section
      className="border-y-[3px] px-5 py-16 lg:px-8"
      style={{ backgroundColor: NEGRO, borderColor: NEGRO, color: HUESO }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <p className={archivo.className + ' text-xs tracking-[0.2em] uppercase'} style={{ color: NARANJA }}>
          Si te suena, es contigo
        </p>
        <ul className="mt-8 grid gap-x-12 gap-y-0 md:grid-cols-2">
          {PROBLEMAS.map((p) => (
            <li
              key={p.servicio}
              className="flex items-start gap-4 border-b border-white/15 py-5"
            >
              <span
                className={archivo.className + ' shrink-0 text-xl'}
                style={{ color: MAGENTA }}
              >
                —
              </span>
              <p className="text-lg leading-snug font-medium">{p.problema}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Cierre() {
  return (
    <section className="px-5 pt-16 pb-28 lg:px-8" style={{ backgroundColor: NARANJA }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8">
        <h2
          className={
            archivo.className +
            ' text-[clamp(1.85rem,7.6vw,2.8rem)] leading-[0.82] tracking-[-0.035em] uppercase sm:text-7xl lg:text-8xl'
          }
        >
          Cuéntanos qué pasa.
          <br />
          <span style={{ color: HUESO, WebkitTextStroke: '3px ' + NEGRO, paintOrder: 'stroke fill' }}>
            Te decimos qué hacer.
          </span>
        </h2>
        <span
          className={
            archivo.className +
            ' inline-flex items-center gap-3 border-[3px] px-8 py-5 text-base uppercase'
          }
          style={{ backgroundColor: NEGRO, borderColor: NEGRO, color: HUESO }}
        >
          Agendar mi videollamada gratis
          <ArrowRight aria-hidden className="size-5" strokeWidth={3} />
        </span>
        <p className="text-sm font-bold">
          Es gratis, dura 30 minutos y sales con un plan — aunque no nos contrates.
        </p>
      </div>
    </section>
  )
}
