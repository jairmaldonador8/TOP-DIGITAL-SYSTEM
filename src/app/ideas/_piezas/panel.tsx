/**
 * Maqueta del panel de campañas de la plataforma.
 *
 * Es la pieza que más gustó de la idea "Consola": en vez de prometer
 * resultados, los enseña — leads del mes, la curva subiendo y el costo por
 * lead de cada campaña. Vive aquí porque la usan dos direcciones distintas
 * ("Consola" y "Mixta"); si se elige alguna, se muda a
 * `src/components/sitio` y los números salen de datos reales.
 */

const CAMPANIAS = [
  { nombre: 'Prospección · Meta', leads: 128, cpl: '$74', avance: 92, estado: 'activa' },
  { nombre: 'Remarketing · Meta', leads: 61, cpl: '$38', avance: 64, estado: 'activa' },
  { nombre: 'Búsqueda · Google', leads: 44, cpl: '$112', avance: 47, estado: 'activa' },
  { nombre: 'Catálogo · Shopping', leads: 19, cpl: '$96', avance: 22, estado: 'pausa' },
]

/** Serie del sparkline; el último punto es el mes en curso. */
const SERIE = [12, 19, 16, 28, 31, 27, 44, 52, 49, 68, 74, 96]

export function PanelCampanias({
  className = '',
  /** Radio del marco: 'suave' se acopla a los radios generosos del sitio. */
  radio = 'consola',
}: {
  className?: string
  radio?: 'consola' | 'suave'
}) {
  const max = Math.max(...SERIE)
  const puntos = SERIE.map((v, i) => {
    const x = (i / (SERIE.length - 1)) * 100
    const y = 100 - (v / max) * 92
    return x.toFixed(2) + ',' + y.toFixed(2)
  }).join(' ')

  const marco = radio === 'suave' ? 'rounded-3xl' : 'rounded-[1.35rem]'
  const halo = radio === 'suave' ? 'rounded-[1.6rem]' : 'rounded-[1.4rem]'

  return (
    <div className={'relative ' + className}>
      <div
        aria-hidden
        className={'bg-marca absolute -inset-px opacity-25 blur-lg ' + halo}
      />
      <div
        className={
          'relative overflow-hidden border border-white/12 bg-[#0a0a0c]/95 shadow-2xl shadow-black/70 backdrop-blur-xl ' +
          marco
        }
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <p className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-white/35 uppercase sm:block">
            topdigital.company / campañas
          </p>
          <span className="font-mono text-[0.6rem] text-emerald-400">● en vivo</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
              Leads este mes
            </p>
            <p className="mt-2 font-mono text-5xl leading-none tracking-tight">252</p>
            <p className="mt-2 text-xs text-emerald-400">+38% contra el mes pasado</p>
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-20 w-full sm:w-56"
            aria-hidden
          >
            <defs>
              <linearGradient id="linea-panel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="52%" stopColor="#f0338d" />
                <stop offset="100%" stopColor="#fca044" />
              </linearGradient>
              <linearGradient id="area-panel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0338d" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f0338d" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={'0,100 ' + puntos + ' 100,100'} fill="url(#area-panel)" />
            <polyline
              points={puntos}
              fill="none"
              stroke="url(#linea-panel)"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <ul className="border-t border-white/10">
          {CAMPANIAS.map((c) => (
            <li
              key={c.nombre}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[0.06] px-5 py-3.5 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      'size-1.5 shrink-0 rounded-full ' +
                      (c.estado === 'activa' ? 'bg-emerald-400' : 'bg-amber-400')
                    }
                    aria-hidden
                  />
                  <p className="truncate text-[0.82rem] font-medium">{c.nombre}</p>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="bg-marca h-full rounded-full"
                    style={{ width: c.avance + '%' }}
                  />
                </div>
              </div>
              <div className="text-right font-mono text-[0.7rem] whitespace-nowrap">
                <p>{c.leads} leads</p>
                <p className="mt-1 text-white/40">{c.cpl} cpl</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
