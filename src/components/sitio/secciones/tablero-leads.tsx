'use client'

import {
  Contador,
  useEnVista,
  useLatido,
  useOnda,
  usePrefiereQuieto,
} from '@/components/sitio/animaciones'

/**
 * El tablero a lo ancho, como sala de control (nació como opción C del
 * taller de /ideas y el cliente la aprobó para el sitio).
 *
 * Una sola pieza de borde a borde del contenedor: tres KPIs que cuentan
 * hacia arriba (y el de leads sigue subiendo con cada latido), la curva
 * del mes dibujándose en grande y ondulando sin parar, las campañas
 * creciendo y respirando al lado y, abajo, un ticker corriendo con los
 * leads que van entrando — el pulso constante de la operación.
 *
 * DATOS DE MAQUETA: cifras, campañas y nombres se cambian por reales.
 */

const SERIE = [12, 19, 16, 28, 31, 27, 44, 52, 49, 68, 74, 96]

const CAMPANIAS = [
  { nombre: 'Prospección · Meta', leads: 128, avance: 92 },
  { nombre: 'Remarketing · Meta', leads: 61, avance: 64 },
  { nombre: 'Búsqueda · Google', leads: 44, avance: 47 },
  { nombre: 'Catálogo · Shopping', leads: 19, avance: 22 },
]

const TICKER = [
  'Nuevo lead · Mariana G. · Meta Ads · Página web',
  'Nuevo lead · Clínica Sonría · Google Ads · Branding',
  'Nuevo lead · Paola V. · Meta Ads · Tienda online',
  'Nuevo lead · Grupo Andrade · Referido · Sistema a la medida',
  'Nuevo lead · Lucía M. · Google Ads · Chatbot con IA',
]

export function TableroLeads() {
  const { ref, visible } = useEnVista()
  const quieto = usePrefiereQuieto()
  const anima = visible && !quieto

  // El latido: el KPI de leads sigue subiendo y la curva ondula sin parar.
  const pulso = useLatido(anima, 4100)
  const serie = useOnda(SERIE, pulso, quieto || !visible)

  const puntos = serie.map((v, i) => {
    const x = (i / (serie.length - 1)) * 100
    const y = 100 - (v / 100) * 88
    return x.toFixed(2) + ',' + y.toFixed(2)
  }).join(' ')

  return (
    <section ref={ref} id="tablero-leads" className="relative py-20 sm:py-24">
      <style>{`
        @keyframes correr-c { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .correr-c { animation: correr-c 30s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .correr-c { animation: none; } }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.28em] text-muted-foreground uppercase">
              Sala de control
            </p>
            <h2 className="font-heading mt-4 max-w-xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[2.6rem]">
              Así se ve tu marketing
              <br />
              <span className="text-marca">cuando sí se mide.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Este es el panel que te entregamos desde el primer mes: tus leads,
            tu costo por lead y cada campaña, en tiempo real.
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="bg-marca absolute -inset-px rounded-[1.6rem] opacity-20 blur-lg"
          />
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a0c]/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
            {/* Marco de navegador. */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
              </div>
              <p className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-white/35 uppercase sm:block">
                topdigital.company / panel
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-emerald-400">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative size-1.5 rounded-full bg-emerald-400" />
                </span>
                en vivo
              </span>
            </div>

            {/* KPIs que cuentan. */}
            <dl className="grid grid-cols-1 divide-y divide-white/10 border-b border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { etiqueta: 'Leads este mes', hasta: 252 + pulso, prefijo: '', sufijo: '', nota: '+38% vs. mes pasado' },
                { etiqueta: 'Costo por lead promedio', hasta: 67, prefijo: '$', sufijo: ' mxn', nota: '−22% vs. mes pasado' },
                { etiqueta: 'Contactados en menos de 15 min', hasta: 92, prefijo: '', sufijo: '%', nota: 'con chatbot + equipo' },
              ].map((k) => (
                <div key={k.etiqueta} className="px-6 py-6">
                  <dt className="font-mono text-[0.62rem] tracking-[0.24em] text-white/40 uppercase">
                    {k.etiqueta}
                  </dt>
                  <dd className="mt-2.5 font-mono text-4xl tracking-tight">
                    <Contador
                      hasta={k.hasta}
                      activo={visible}
                      prefijo={k.prefijo}
                      sufijo={k.sufijo}
                    />
                  </dd>
                  <p className="mt-1.5 text-xs text-emerald-400">{k.nota}</p>
                </div>
              ))}
            </dl>

            {/* Curva grande + campañas. */}
            <div className="grid gap-8 p-6 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.24em] text-white/40 uppercase">
                  Leads por semana
                </p>
                <svg
                  viewBox="0 0 100 46"
                  preserveAspectRatio="none"
                  className="mt-4 h-44 w-full sm:h-52"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="linea-c" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="52%" stopColor="#f0338d" />
                      <stop offset="100%" stopColor="#fca044" />
                    </linearGradient>
                    <linearGradient id="area-c" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0338d" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f0338d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Rejilla de referencia. */}
                  {[0.25, 0.5, 0.75].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="100"
                      y1={46 * y}
                      y2={46 * y}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="0.3"
                    />
                  ))}
                  <g transform="scale(1,0.46)">
                    <polygon
                      points={'0,100 ' + puntos + ' 100,100'}
                      fill="url(#area-c)"
                      className="transition-opacity duration-700"
                      style={{ opacity: visible ? 1 : 0, transitionDelay: '1100ms' }}
                    />
                    <polyline
                      points={puntos}
                      fill="none"
                      stroke="url(#linea-c)"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      pathLength={100}
                      strokeDasharray={100}
                      strokeDashoffset={visible ? 0 : 100}
                      style={
                        anima
                          ? {
                              transition:
                                'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1) 0.3s',
                            }
                          : undefined
                      }
                    />
                  </g>
                </svg>
              </div>

              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.24em] text-white/40 uppercase">
                  Por campaña
                </p>
                <ul className="mt-4 space-y-4">
                  {CAMPANIAS.map((c, i) => {
                    // Sigue sumando con el latido; la barra respira apenas.
                    const extra = Math.floor((pulso + i) / CAMPANIAS.length)
                    const ancho = Math.min(
                      97,
                      c.avance + extra + (anima ? 2 * Math.sin(pulso * 0.9 + i * 1.7) : 0)
                    )
                    return (
                    <li key={c.nombre}>
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="truncate text-[0.82rem] font-medium">{c.nombre}</p>
                        <p className="font-mono text-[0.7rem] whitespace-nowrap text-white/50">
                          {c.leads + extra} leads
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="bg-marca h-full rounded-full"
                          style={{
                            width: visible ? ancho.toFixed(1) + '%' : '0%',
                            ...(anima && {
                              transition: 'width 2.4s cubic-bezier(0.4,0,0.2,1)',
                              transitionDelay: 300 + i * 120 + 'ms',
                            }),
                          }}
                        />
                      </div>
                    </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* Ticker: el pulso de leads entrando. */}
            <div className="overflow-hidden border-t border-white/10 bg-white/[0.02] py-2.5">
              <div className="correr-c flex w-max">
                {[0, 1].map((v) => (
                  <div key={v} className="flex shrink-0">
                    {TICKER.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-2.5 px-8 font-mono text-[0.65rem] whitespace-nowrap text-white/45"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                        {t}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
