'use client'

import { MessageCircle } from 'lucide-react'

import {
  useEnVista,
  useLatido,
  usePrefiereQuieto,
} from '@/components/sitio/animaciones'
import { BotonCta } from '@/components/sitio/cta'

/**
 * La bandeja de entrada de leads, en vivo (nació como opción B del taller
 * de /ideas y el cliente la aprobó para el sitio).
 *
 * En vez de la vista de campañas, el argumento es el momento que el
 * cliente quiere vivir: los leads cayendo — y NUNCA dejan de caer. La
 * fila de llegadas es circular: cada latido entra una tarjeta nueva
 * (nombre, qué busca, de qué campaña vino) y el contador grande sube con
 * cada una, sin final. Cada lead avisa también por WhatsApp.
 *
 * DATOS DE MAQUETA: nombres y campañas inventados; se cambian por reales.
 */

// Fila circular de llegadas: cuando se acaba, vuelve a empezar.
const LEADS = [
  { nombre: 'Dra. Fernanda C.', busca: 'Departamento externo', fuente: 'Referido' },
  { nombre: 'Taller RM', busca: 'Página web', fuente: 'Meta Ads' },
  { nombre: 'Lucía M.', busca: 'Chatbot con IA', fuente: 'Google Ads' },
  { nombre: 'Grupo Andrade', busca: 'Sistema a la medida', fuente: 'Referido' },
  { nombre: 'Paola V.', busca: 'Tienda online', fuente: 'Meta Ads' },
  { nombre: 'Clínica Sonría', busca: 'Branding', fuente: 'Google Ads' },
  { nombre: 'Ing. Roberto T.', busca: 'Campañas Meta', fuente: 'Meta Ads' },
  { nombre: 'Mariana G.', busca: 'Página web', fuente: 'Meta Ads' },
]

const BASE = 252
const VISIBLES = 5
const TIEMPOS = ['ahora', 'hace 2 min', 'hace 5 min', 'hace 9 min', 'hace 14 min']

/** Índice circular que aguanta negativos. */
function circular(i: number) {
  return ((i % LEADS.length) + LEADS.length) % LEADS.length
}

/** Iniciales para el avatar, sin depender de fotos. */
function iniciales(nombre: string) {
  return nombre
    .replace(/^(Ing\.|Dra\.|Dr\.)\s+/, '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function RecibidorLeads() {
  const { ref, visible } = useEnVista()
  const quieto = usePrefiereQuieto()
  // Un latido = un lead nuevo, para siempre. La bandeja nace llena para
  // que nunca se vea vacía, y en cada pulso entra el siguiente del círculo.
  const pulso = useLatido(visible && !quieto, 4300)

  const bandeja = Array.from({ length: VISIBLES }, (_, k) => {
    const arribo = pulso - k
    return { ...LEADS[circular(arribo)], arribo, hace: TIEMPOS[k] }
  })
  const total = pulso

  return (
    <section ref={ref} id="recibidor-leads" className="relative py-20 sm:py-24">
      <style>{`
        @keyframes caer-b {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        @keyframes pop-b { 0% { transform: scale(1); } 35% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .pop-b { animation: pop-b 0.5s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .caer-b, .pop-b { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1fr]">
        {/* La bandeja recibiendo. */}
        <div className="relative order-2 lg:order-1">
          <div
            aria-hidden
            className="bg-marca absolute -inset-px rounded-[1.6rem] opacity-25 blur-lg"
          />
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a0c]/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <p className="font-mono text-[0.6rem] tracking-[0.2em] text-white/35 uppercase">
                topdigital.company / leads
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-emerald-400">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative size-1.5 rounded-full bg-emerald-400" />
                </span>
                recibiendo
              </span>
            </div>

            <ul className="min-h-[23rem] p-3" aria-live="polite">
              {bandeja.map((l, i) => (
                <li
                  key={l.arribo}
                  className="caer-b mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 last:mb-0"
                  style={{
                    animation: 'caer-b 0.5s cubic-bezier(0.2,0.8,0.3,1) both',
                    opacity: 1 - i * 0.13,
                  }}
                >
                  <span className="bg-marca flex size-9 items-center justify-center rounded-full text-[0.7rem] font-bold text-white">
                    {iniciales(l.nombre)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.85rem] font-semibold">
                      {l.nombre}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-400">
                          nuevo
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Busca: {l.busca}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[0.62rem] whitespace-nowrap text-white/50">
                      {l.fuente}
                    </p>
                    <p className="mt-1 font-mono text-[0.6rem] text-white/30">{l.hace}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2.5 border-t border-white/10 px-5 py-3.5 text-xs text-muted-foreground">
              <MessageCircle aria-hidden className="size-3.5 text-emerald-400" />
              Cada lead te avisa también por WhatsApp y correo, al instante.
            </div>
          </div>
        </div>

        {/* El argumento, con el contador subiendo con cada llegada. */}
        <div className="order-1 lg:order-2">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-muted-foreground uppercase">
            El recibidor de tus leads
          </p>
          <h2 className="font-heading mt-4 text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[2.6rem]">
            Mientras lees esto,
            <br />
            <span className="text-marca">te está cayendo uno.</span>
          </h2>

          <div className="mt-8 flex items-end gap-4">
            <p
              key={pulso}
              className="pop-b font-mono text-6xl leading-none tracking-tight sm:text-7xl"
            >
              {(BASE + total).toLocaleString('es-MX')}
            </p>
            <div className="pb-1">
              <p className="text-sm font-semibold text-emerald-400">+38% este mes</p>
              <p className="text-xs text-muted-foreground">leads recibidos</p>
            </div>
          </div>

          <p className="mt-7 max-w-md leading-relaxed text-muted-foreground">
            Las campañas traen gente; la plataforma la recibe, la ordena y te
            la pone enfrente con nombre, interés y de qué anuncio vino. Tu
            único trabajo es contestar — y si tampoco quieres hacer eso, el
            chatbot contesta por ti.
          </p>

          <BotonCta
            tamano="chico"
            texto="Quiero recibir leads así"
            className="mt-8"
          />
        </div>
      </div>
    </section>
  )
}
