'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

import { useEnVista, usePrefiereQuieto } from '@/components/sitio/animaciones'
import { BotonCta } from '@/components/sitio/cta'

/**
 * OPCIÓN "VIVO" — el tablero que nunca se detiene (estilo Shopify).
 *
 * Todo cuelga de un LATIDO: cada ~4 segundos "cae un lead" y el tablero
 * entero reacciona a la vez — entra la tarjeta a la bandeja, el contador
 * sube con un pop, la curva se desliza un paso y las campañas avanzan.
 * Además el marco reacciona al cursor (inclinación 3D + brillo que lo
 * sigue) y un ticker corre abajo sin parar. Es el eslogan hecho interfaz:
 * siempre encendidos.
 *
 * Con prefers-reduced-motion todo queda quieto en su estado final.
 * DATOS DE MAQUETA: nombres y cifras se cambian por datos reales.
 */

// En orden de llegada infinita (se recorre en círculo).
const LEADS = [
  { nombre: 'Mariana G.', busca: 'Página web', fuente: 'Meta Ads' },
  { nombre: 'Ing. Roberto T.', busca: 'Campañas Meta', fuente: 'Meta Ads' },
  { nombre: 'Clínica Sonría', busca: 'Branding', fuente: 'Google Ads' },
  { nombre: 'Paola V.', busca: 'Tienda online', fuente: 'Meta Ads' },
  { nombre: 'Grupo Andrade', busca: 'Sistema a la medida', fuente: 'Referido' },
  { nombre: 'Lucía M.', busca: 'Chatbot con IA', fuente: 'Google Ads' },
  { nombre: 'Taller RM', busca: 'Página web', fuente: 'Meta Ads' },
  { nombre: 'Dra. Fernanda C.', busca: 'Departamento externo', fuente: 'Referido' },
]

const BASE = 252
const LATIDO_MS = 3900
const VISIBLES = 5
const TIEMPOS = ['ahora', 'hace 2 min', 'hace 6 min', 'hace 11 min', 'hace 17 min']

const CAMPANIAS = [
  { nombre: 'Prospección · Meta', base: 128, avance: 88 },
  { nombre: 'Remarketing · Meta', base: 61, avance: 62 },
  { nombre: 'Búsqueda · Google', base: 44, avance: 45 },
  { nombre: 'Catálogo · Shopping', base: 19, avance: 22 },
]

const TICKER = [
  'Nuevo lead · Mariana G. · Meta Ads · Página web',
  'Nuevo lead · Clínica Sonría · Google Ads · Branding',
  'Nuevo lead · Paola V. · Meta Ads · Tienda online',
  'Nuevo lead · Grupo Andrade · Referido · Sistema a la medida',
  'Nuevo lead · Lucía M. · Google Ads · Chatbot con IA',
]

/** Índice circular que aguanta negativos. */
function circular(i: number) {
  return ((i % LEADS.length) + LEADS.length) % LEADS.length
}

function iniciales(nombre: string) {
  return nombre
    .replace(/^(Ing\.|Dra\.|Dr\.)\s+/, '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/**
 * Valor de la curva en el paso absoluto n: mezcla de senos, determinista
 * (mismo dibujo en servidor y cliente) y sin saltos entre pasos.
 */
function valorSerie(n: number) {
  const v =
    46 +
    24 * Math.sin(n * 0.52) +
    16 * Math.sin(n * 1.31 + 2) +
    7 * Math.sin(n * 2.7 + 5)
  return Math.min(96, Math.max(10, v))
}

/** El reloj de la sección: cuenta latidos mientras esté en pantalla. */
function useLatido(activo: boolean) {
  const [pulso, setPulso] = useState(0)
  useEffect(() => {
    if (!activo) return
    const reloj = setInterval(() => setPulso((p) => p + 1), LATIDO_MS)
    return () => clearInterval(reloj)
  }, [activo])
  return pulso
}

export function SeccionLeadsVivo() {
  const { ref, visible } = useEnVista()
  const quieto = usePrefiereQuieto()
  const pulso = useLatido(visible && !quieto)

  // ── Curva deslizante: la ventana avanza un paso por latido y la
  // transición entre ventanas se interpola con rAF para que fluya. El
  // valor interpolado vive en estado (leerlo en render está permitido);
  // el ref es solo un espejo para que el efecto arranque desde el cuadro
  // exacto donde quedó el anterior.
  const objetivo = useMemo(
    () => Array.from({ length: 12 }, (_, k) => valorSerie(pulso + k)),
    [pulso]
  )
  const [serieVisual, setSerieVisual] = useState(objetivo)
  const espejo = useRef(objetivo)

  useEffect(() => {
    if (quieto) return
    const desde = [...espejo.current]
    const inicio = performance.now()
    let marco = 0
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / 550, 1)
      const s = 1 - Math.pow(1 - t, 3)
      const cuadro = objetivo.map((v, i) => desde[i] + (v - desde[i]) * s)
      espejo.current = cuadro
      setSerieVisual(cuadro)
      if (t < 1) marco = requestAnimationFrame(paso)
    }
    marco = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(marco)
  }, [objetivo, quieto])

  const serie = quieto ? objetivo : serieVisual
  const puntos = serie
    .map((v, i) => {
      const x = (i / (serie.length - 1)) * 100
      const y = 100 - (v / 100) * 92
      return x.toFixed(2) + ',' + y.toFixed(2)
    })
    .join(' ')

  // ── Inclinación 3D + brillo siguiendo el cursor (solo puntero fino).
  const marco = useRef<HTMLDivElement>(null)
  const alMover = (e: React.MouseEvent) => {
    const nodo = marco.current
    if (!nodo || quieto || !window.matchMedia('(pointer: fine)').matches) return
    const caja = nodo.getBoundingClientRect()
    const px = (e.clientX - caja.left) / caja.width - 0.5
    const py = (e.clientY - caja.top) / caja.height - 0.5
    nodo.style.setProperty('--ry', (px * 5).toFixed(2) + 'deg')
    nodo.style.setProperty('--rx', (-py * 4).toFixed(2) + 'deg')
    nodo.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%')
    nodo.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%')
    nodo.style.setProperty('--go', '1')
  }
  const alSalir = () => {
    const nodo = marco.current
    if (!nodo) return
    nodo.style.setProperty('--rx', '0deg')
    nodo.style.setProperty('--ry', '0deg')
    nodo.style.setProperty('--go', '0')
  }

  // ── La bandeja siempre está llena: en el latido p se muestran los
  // arribos p, p−1, p−2, p−3 (los negativos también existen en el círculo).
  const bandeja = Array.from({ length: VISIBLES }, (_, k) => {
    const arribo = pulso - k
    return { ...LEADS[circular(arribo)], arribo, hace: TIEMPOS[k] }
  })

  const totalLeads = BASE + pulso

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-24">
      <style>{`
        @keyframes vivo-caer { from { opacity: 0; transform: translateY(-14px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes vivo-pop { 0% { transform: scale(1); } 35% { transform: scale(1.06); } 100% { transform: scale(1); } }
        @keyframes vivo-mas { 0% { opacity: 0; transform: translateY(8px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-16px); } }
        @keyframes vivo-correr { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes vivo-deriva { from { transform: translate(-4%, -3%) scale(1); } to { transform: translate(5%, 4%) scale(1.12); } }
        .vivo-correr { animation: vivo-correr 30s linear infinite; }
        .vivo-deriva { animation: vivo-deriva 11s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) {
          .vivo-correr, .vivo-deriva { animation: none !important; }
          .vivo-anim { animation: none !important; }
        }
      `}</style>

      {/* Atmósfera que respira detrás del tablero. */}
      <div
        aria-hidden
        className="vivo-deriva bg-marca pointer-events-none absolute top-10 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-[130px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.28em] text-muted-foreground uppercase">
              Siempre encendidos
            </p>
            <h2 className="font-heading mt-4 max-w-xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[2.6rem]">
              Esto no es una foto:
              <br />
              <span className="text-marca">está pasando.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Así se ve tu operación en nuestra plataforma: leads entrando,
            campañas moviéndose y números que no esperan al reporte del lunes.
          </p>
        </div>

        {/* El marco reacciona al cursor: inclinación + brillo. */}
        <div style={{ perspective: '1400px' }}>
          <div
            ref={marco}
            onMouseMove={alMover}
            onMouseLeave={alSalir}
            className="relative transition-transform duration-200 ease-out will-change-transform"
            style={{
              transform:
                'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
            }}
          >
            <div
              aria-hidden
              className="bg-marca absolute -inset-px rounded-[1.6rem] opacity-20 blur-lg"
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a0c]/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
              {/* Brillo que sigue al cursor. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                  opacity: 'var(--go, 0)',
                  background:
                    'radial-gradient(34rem circle at var(--gx, 50%) var(--gy, 30%), rgba(240,51,141,0.08), transparent 55%)',
                }}
              />

              <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-2.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                </div>
                <p className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-white/35 uppercase sm:block">
                  topdigital.company / en vivo
                </p>
                <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-emerald-400">
                  <span className="relative flex size-1.5" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                    <span className="relative size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  en vivo
                </span>
              </div>

              <div className="relative grid lg:grid-cols-[1.25fr_1fr]">
                {/* Columna de números: contador que late + curva que corre. */}
                <div className="border-b border-white/10 p-6 lg:border-r lg:border-b-0">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="relative">
                      <p className="font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
                        Leads este mes
                      </p>
                      <p
                        key={pulso}
                        className="vivo-anim mt-2 font-mono text-6xl leading-none tracking-tight"
                        style={{ animation: 'vivo-pop 0.5s ease-out' }}
                      >
                        {totalLeads.toLocaleString('es-MX')}
                      </p>
                      {/* El "+1" que sube y se disuelve con cada llegada. */}
                      {pulso > 0 && (
                        <span
                          key={'mas-' + pulso}
                          aria-hidden
                          className="vivo-anim absolute -top-1 right-0 font-mono text-sm font-bold text-emerald-400"
                          style={{ animation: 'vivo-mas 1.6s ease-out both' }}
                        >
                          +1
                        </span>
                      )}
                      <p className="mt-2 text-xs text-emerald-400">
                        +38% contra el mes pasado
                      </p>
                    </div>
                    <dl className="flex gap-6">
                      {[
                        { k: 'CPL promedio', v: '$67' },
                        { k: 'Respuesta <15 min', v: '92%' },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <dt className="font-mono text-[0.55rem] tracking-[0.18em] text-white/35 uppercase">
                            {k}
                          </dt>
                          <dd className="mt-1 font-mono text-xl">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* El punto del presente vive fuera del SVG: adentro se
                      estiraría en óvalo porque el lienzo no guarda proporción. */}
                  <div className="relative mt-6">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="h-36 w-full sm:h-44"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="linea-vivo" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="52%" stopColor="#f0338d" />
                        <stop offset="100%" stopColor="#fca044" />
                      </linearGradient>
                      <linearGradient id="area-vivo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f0338d" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f0338d" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[25, 50, 75].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        x2="100"
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeWidth="0.4"
                      />
                    ))}
                    <polygon points={'0,100 ' + puntos + ' 100,100'} fill="url(#area-vivo)" />
                    <polyline
                      points={puntos}
                      fill="none"
                      stroke="url(#linea-vivo)"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    aria-hidden
                    className="bg-marca-naranja absolute size-2 rounded-full shadow-[0_0_10px_2px_rgba(252,160,68,0.55)]"
                    style={{
                      right: '-4px',
                      top: 'calc(' + (100 - (serie[serie.length - 1] / 100) * 92).toFixed(2) + '% - 4px)',
                    }}
                  />
                  </div>

                  <ul className="mt-5 space-y-3">
                    {CAMPANIAS.map((c, i) => {
                      // Cada campaña crece a su ritmo y su barra ondula apenas.
                      const extra = Math.floor((pulso + i) / CAMPANIAS.length)
                      const ancho = Math.min(
                        97,
                        c.avance + 2.5 * Math.sin(pulso * 0.9 + i * 1.7) + extra
                      )
                      return (
                        <li key={c.nombre}>
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="truncate text-[0.8rem] font-medium">{c.nombre}</p>
                            <p className="font-mono text-[0.68rem] whitespace-nowrap text-white/50">
                              {c.base + extra} leads
                            </p>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="bg-marca h-full rounded-full transition-[width] duration-700 ease-out"
                              style={{ width: ancho.toFixed(1) + '%' }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* La bandeja, recibiendo sin parar. */}
                <div className="flex flex-col">
                  <p className="border-b border-white/10 px-5 py-3 font-mono text-[0.6rem] tracking-[0.22em] text-white/35 uppercase">
                    Últimos leads
                  </p>
                  <ul className="flex-1 p-3" aria-live="off">
                    {bandeja.map((l, k) => (
                      <li
                        key={l.arribo}
                        className="vivo-anim mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 last:mb-0"
                        style={{
                          animation: 'vivo-caer 0.5s cubic-bezier(0.2,0.8,0.3,1) both',
                          opacity: 1 - k * 0.14,
                        }}
                      >
                        <span className="bg-marca flex size-8 items-center justify-center rounded-full text-[0.62rem] font-bold text-white">
                          {iniciales(l.nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.8rem] font-semibold">
                            {l.nombre}
                            {k === 0 && (
                              <span className="ml-2 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[0.55rem] font-bold text-emerald-400">
                                nuevo
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                            {l.busca} · {l.fuente}
                          </p>
                        </div>
                        <p className="font-mono text-[0.58rem] whitespace-nowrap text-white/30">
                          {l.hace}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3 text-[0.72rem] text-muted-foreground">
                    <MessageCircle aria-hidden className="size-3.5 text-emerald-400" />
                    Cada uno te avisa por WhatsApp al instante.
                  </div>
                </div>
              </div>

              {/* El pulso constante de fondo. */}
              <div className="relative overflow-hidden border-t border-white/10 bg-white/[0.02] py-2">
                <div className="vivo-correr flex w-max">
                  {[0, 1].map((v) => (
                    <div key={v} className="flex shrink-0">
                      {TICKER.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-2 px-7 font-mono text-[0.62rem] whitespace-nowrap text-white/40"
                        >
                          <span className="size-1 rounded-full bg-emerald-400" aria-hidden />
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

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <BotonCta texto="Quiero mi operación así de viva" />
          <p className="text-xs text-muted-foreground">
            Acceso a la plataforma incluido desde el primer mes, en cualquier plan.
          </p>
        </div>
      </div>
    </section>
  )
}
