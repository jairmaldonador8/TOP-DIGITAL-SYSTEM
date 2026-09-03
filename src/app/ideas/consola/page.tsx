import { ArrowRight, Check } from 'lucide-react'

import { PanelCampanias } from '@/app/ideas/_piezas/panel'
import { Lockup, Topi } from '@/components/sitio/marca'
import { CERTIFICACIONES, METRICAS } from '@/lib/sitio/contenido'
import { SERVICIOS } from '@/lib/sitio/servicios'

/**
 * IDEA "CONSOLA" — el argumento no es la agencia, es la plataforma.
 *
 * Negro puro con una rejilla de precisión encima, etiquetas en monoespacio
 * como en un panel de control, y el degradado convertido en LUZ: hilos de
 * neón y resplandores, nunca relleno. La portada muestra el CRM real que
 * ya se le entrega al cliente — la promesa deja de ser "hacemos marketing"
 * y pasa a ser "vas a ver tus números en vivo".
 */

export default function IdeaConsola() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-black text-white">
      {/* Rejilla de precisión + halo de marca: la atmósfera de la idea. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-72 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-[150px]"
        style={{
          background:
            'linear-gradient(100deg, #7c3aed 0%, #f0338d 52%, #fca044 100%)',
        }}
      />

      <div className="relative">
        <Barra />
        <Portada />
        <Cinta />
        <Modulos />
        <Sellos />
        <Cierre />
      </div>
    </div>
  )
}

/** Etiqueta monoespaciada; el tic visual que sostiene toda la idea. */
function Clave({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
      {children}
    </p>
  )
}

function Barra() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Lockup className="h-8 w-auto" />
        <nav className="hidden gap-8 font-mono text-[0.68rem] tracking-[0.16em] text-white/50 uppercase md:flex">
          {['Plataforma', 'Servicios', 'Casos', 'Precios'].map((t) => (
            <span key={t} className="cursor-default">
              {t}
            </span>
          ))}
        </nav>
        <span className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold">
          Agendar diagnóstico
        </span>
      </div>
    </header>
  )
}

function Portada() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pt-20 pb-24 lg:grid-cols-[1fr_1.05fr] lg:px-8">
      <div>
        <span className="inline-flex items-center gap-2.5 rounded-md border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] uppercase">
          <span className="bg-marca size-1.5 rounded-full" aria-hidden />
          Agencia + plataforma
        </span>

        <h1 className="mt-7 text-[2.7rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-[3.6rem]">
          Tu marketing deja de
          <br />
          ser una caja negra<span className="text-marca">.</span>
        </h1>

        <p className="mt-6 max-w-lg leading-relaxed text-white/60">
          Marca, sitio y campañas operados por nuestro equipo — y una
          plataforma donde ves tus leads, tu costo por lead y tus resultados en
          vivo. Sin reportes maquillados y sin esperar al lunes.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <span className="bg-marca inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold">
            Agendar diagnóstico gratis
            <ArrowRight aria-hidden className="size-4" />
          </span>
          <span className="font-mono text-[0.68rem] tracking-[0.14em] text-white/40 uppercase">
            30 min · sin costo
          </span>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {METRICAS.map(({ cifra, unidad, etiqueta }) => (
            <div key={etiqueta} className="bg-black px-4 py-5">
              <dd className="font-mono text-2xl tracking-tight">
                {cifra}
                <span className="ml-0.5 text-[0.6rem] text-white/45">{unidad}</span>
              </dd>
              <dt className="mt-2 text-[0.68rem] leading-snug text-white/45">
                {etiqueta}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      <PanelCampanias />
    </section>
  )
}

function Cinta() {
  return (
    <div
      aria-hidden
      className="bg-marca mx-auto h-px w-full max-w-7xl opacity-60"
      style={{ boxShadow: '0 0 24px 1px rgba(240,51,141,0.45)' }}
    />
  )
}

function Modulos() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-24 lg:px-8">
      <Clave>Módulos</Clave>
      <h2 className="mt-5 max-w-2xl text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-[2.7rem]">
        Se contratan sueltos. Trabajan mejor conectados.
      </h2>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICIOS.map((s, i) => (
          <article key={s.slug} className="group bg-black p-6 transition-colors hover:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-white/30">
                {String(i + 1).padStart(2, '0')}
              </p>
              {s.enPremium && (
                <span className="font-mono text-[0.55rem] tracking-[0.16em] text-white/30 uppercase">
                  premium
                </span>
              )}
            </div>
            <h3 className="mt-5 text-base font-semibold">{s.etiqueta}</h3>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-white/50">
              {s.frase}
            </p>
            <p className="mt-6 border-t border-white/10 pt-4 font-mono text-sm">
              ${s.desde.toLocaleString('es-MX')}
              <span className="text-white/35">
                {s.periodo === 'mes' ? ' /mes' : ' único'}
              </span>
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Sellos() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-10 gap-y-5 px-5 py-8 lg:px-8">
        <Clave>Certificados por</Clave>
        {CERTIFICACIONES.map((c) => (
          <span key={c.nombre} className="flex items-center gap-2 text-sm text-white/70">
            <Check aria-hidden className="text-marca-magenta size-3.5" />
            {c.nombre}
          </span>
        ))}
      </div>
    </section>
  )
}

function Cierre() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-24 pb-32 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.03] px-8 py-16 sm:px-14">
        <div
          aria-hidden
          className="bg-marca pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-30 blur-[100px]"
        />
        <Topi
          decorativo
          className="pointer-events-none absolute -right-8 -bottom-16 hidden h-72 w-auto opacity-90 lg:block"
        />
        <div className="relative max-w-2xl">
          <Clave>Videollamada de diagnóstico</Clave>
          <h2 className="mt-5 text-[2.2rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Te abrimos el panel antes de que nos contrates.
          </h2>
          <p className="mt-5 leading-relaxed text-white/60">
            En 30 minutos revisamos tus números reales, te decimos qué te está
            frenando y te enseñamos cómo se vería tu operación adentro. Sin
            costo y sin compromiso.
          </p>
          <span className="bg-marca mt-9 inline-flex items-center gap-2 rounded-lg px-7 py-4 text-sm font-bold">
            Agendar mi videollamada
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </div>
      </div>
    </section>
  )
}
