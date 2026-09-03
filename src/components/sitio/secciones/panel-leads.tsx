'use client'

import { Check } from 'lucide-react'

import {
  Contador,
  useEnVista,
  useLatido,
  useOnda,
  usePrefiereQuieto,
} from '@/components/sitio/animaciones'
import { BotonCta } from '@/components/sitio/cta'

/**
 * El panel de campañas de la plataforma, vivo (nació como opción A del
 * taller de /ideas y el cliente la aprobó para el sitio).
 *
 * Todo se pone en marcha
 * cuando entra en pantalla: la cifra cuenta hasta 252, la curva se dibuja
 * de izquierda a derecha, las barras de cada campaña se llenan en cascada
 * y el punto "en vivo" respira. A la izquierda, el argumento de venta.
 *
 * DATOS DE MAQUETA: campañas y cifras se reemplazan con datos reales.
 */

const CAMPANIAS = [
  { nombre: 'Prospección · Meta', leads: 128, cpl: '$74', avance: 92, activa: true },
  { nombre: 'Remarketing · Meta', leads: 61, cpl: '$38', avance: 64, activa: true },
  { nombre: 'Búsqueda · Google', leads: 44, cpl: '$112', avance: 47, activa: true },
  { nombre: 'Catálogo · Shopping', leads: 19, cpl: '$96', avance: 22, activa: false },
]

const SERIE = [12, 19, 16, 28, 31, 27, 44, 52, 49, 68, 74, 96]

const ARGUMENTOS = [
  'Ves cada lead en cuanto llega, con su campaña y su costo',
  'Sabemos qué campaña jala y cuál se apaga — y tú también',
  'Reporte semanal automático, sin perseguir a nadie',
]

export function PanelLeads() {
  const { ref, visible } = useEnVista()
  const quieto = usePrefiereQuieto()
  const anima = visible && !quieto
  const asentado = visible // con movimiento reducido: estado final directo

  // El latido arranca después de la entrada y ya no para: +1 lead por
  // pulso, curva ondulando y campañas sumando.
  const pulso = useLatido(anima)
  const serie = useOnda(SERIE, pulso, quieto || !visible)

  const puntos = serie.map((v, i) => {
    const x = (i / (serie.length - 1)) * 100
    const y = 100 - (v / 100) * 92
    return x.toFixed(2) + ',' + y.toFixed(2)
  }).join(' ')

  return (
    <section
      ref={ref}
      id="panel-leads"
      className="relative scroll-mt-24 py-20 sm:py-24"
    >
      <style>{`
        @keyframes animar-mas { 0% { opacity: 0; transform: translateY(8px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-16px); } }
        .animar-mas { animation: animar-mas 1.6s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .animar-mas { animation: none; opacity: 0; } }
      `}</style>
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-muted-foreground uppercase">
            Tu panel de leads
          </p>
          <h2 className="font-heading mt-4 text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[2.6rem]">
            Cada lead que llega,
            <br />
            <span className="text-marca">lo ves llegar.</span>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            No trabajamos a ciegas ni te pedimos fe: desde el primer mes tienes
            acceso a la plataforma donde caen tus leads y viven tus números.
          </p>
          <ul className="mt-7 space-y-3.5">
            {ARGUMENTOS.map((a) => (
              <li key={a} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="bg-marca mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
                </span>
                {a}
              </li>
            ))}
          </ul>
          <BotonCta tamano="chico" texto="Quiero ver mi panel" className="mt-8" />
        </div>

        {/* El panel de la captura, con vida. */}
        <div className="relative">
          <div
            aria-hidden
            className="bg-marca absolute -inset-px rounded-[1.6rem] opacity-25 blur-lg"
          />
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a0c]/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
              </div>
              <p className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-white/35 uppercase sm:block">
                topdigital.company / campañas
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-emerald-400">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative size-1.5 rounded-full bg-emerald-400" />
                </span>
                en vivo
              </span>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
                  Leads este mes
                </p>
                <p className="relative mt-2 font-mono text-5xl leading-none tracking-tight">
                  <Contador hasta={252 + pulso} activo={visible} />
                  {pulso > 0 && (
                    <span
                      key={pulso}
                      aria-hidden
                      className="animar-mas absolute -top-2 -right-6 font-mono text-sm font-bold text-emerald-400"
                    >
                      +1
                    </span>
                  )}
                </p>
                <p
                  className="mt-2 text-xs text-emerald-400 transition-opacity duration-700"
                  style={{ opacity: asentado ? 1 : 0, transitionDelay: '900ms' }}
                >
                  +38% contra el mes pasado
                </p>
              </div>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-20 w-full sm:w-56"
                aria-hidden
              >
                <defs>
                  <linearGradient id="linea-a" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="52%" stopColor="#f0338d" />
                    <stop offset="100%" stopColor="#fca044" />
                  </linearGradient>
                  <linearGradient id="area-a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0338d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f0338d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={'0,100 ' + puntos + ' 100,100'}
                  fill="url(#area-a)"
                  className="transition-opacity duration-700"
                  style={{ opacity: asentado ? 1 : 0, transitionDelay: '1100ms' }}
                />
                {/* La curva se dibuja sola: dasharray al 100% y el offset baja a 0. */}
                <polyline
                  points={puntos}
                  fill="none"
                  stroke="url(#linea-a)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={asentado ? 0 : 100}
                  style={
                    anima
                      ? { transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s' }
                      : undefined
                  }
                />
              </svg>
            </div>

            <ul className="border-t border-white/10">
              {CAMPANIAS.map((c, i) => {
                // Cada campaña sigue sumando a su ritmo; la barra respira.
                const extra = Math.floor((pulso + i) / CAMPANIAS.length)
                const ancho = Math.min(
                  97,
                  c.avance + extra + (anima ? 2 * Math.sin(pulso * 0.9 + i * 1.7) : 0)
                )
                return (
                <li
                  key={c.nombre}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[0.06] px-5 py-3.5 transition-all duration-500 last:border-b-0 motion-reduce:transition-none"
                  style={{
                    opacity: asentado ? 1 : 0,
                    transform: asentado ? 'none' : 'translateY(8px)',
                    transitionDelay: 400 + i * 140 + 'ms',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={
                          'size-1.5 shrink-0 rounded-full ' +
                          (c.activa ? 'bg-emerald-400' : 'bg-amber-400')
                        }
                        aria-hidden
                      />
                      <p className="truncate text-[0.82rem] font-medium">{c.nombre}</p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="bg-marca h-full rounded-full"
                        style={{
                          width: asentado ? ancho.toFixed(1) + '%' : '0%',
                          ...(anima && {
                            transition: 'width 2.4s cubic-bezier(0.4,0,0.2,1)',
                            transitionDelay: 300 + i * 120 + 'ms',
                          }),
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right font-mono text-[0.7rem] whitespace-nowrap">
                    <p>{c.leads + extra} leads</p>
                    <p className="mt-1 text-white/40">{c.cpl} cpl</p>
                  </div>
                </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
