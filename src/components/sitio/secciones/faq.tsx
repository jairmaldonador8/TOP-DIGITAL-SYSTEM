'use client'

import { useState } from 'react'
import { CornerDownLeft } from 'lucide-react'

import { BotonCta } from '@/components/sitio/cta'
import { Topi } from '@/components/sitio/marca'
import { Revelar } from '@/components/sitio/revelar'
import { buscarFaqs, UMBRAL_CONFIANZA } from '@/lib/sitio/buscar-faq'
import { CONTACTO } from '@/lib/sitio/contenido'

const SUGERENCIAS = [
  '¿Cuánto cuesta una página web?',
  '¿En cuánto tiempo veo resultados?',
  '¿Hay permanencia forzosa?',
  '¿Trabajan con negocios como el mío?',
]

type Mensaje = {
  id: number
  de: 'topi' | 'yo'
  texto: string
  /** Cuando Topi no sabe, ofrece la salida en vez de inventar. */
  sinRespuesta?: boolean
  /** Otras preguntas que sí tiene cargadas y podrían servir. */
  relacionadas?: string[]
}

const SALUDO: Mensaje = {
  id: 0,
  de: 'topi',
  texto:
    '¡Hola! Soy Topi. Pregúntame lo que quieras sobre precios, tiempos, cómo trabajamos o qué incluye cada servicio — contesto con lo que tengo cargado. Si algo no lo sé, te lo digo y lo vemos en la videollamada.',
}

/**
 * Construye la respuesta de Topi a partir de las preguntas cargadas.
 *
 * No hay modelo de lenguaje detrás: es el buscador propio del sitio. Por
 * eso, cuando ninguna respuesta pasa el umbral de confianza, Topi dice que
 * no sabe en lugar de improvisar — inventarle un precio a un prospecto
 * cuesta más caro que no contestarle.
 */
function responder(consulta: string, id: number): Mensaje {
  const resultados = buscarFaqs(consulta)
  const mejor = resultados[0]

  if (!mejor || mejor.puntaje < UMBRAL_CONFIANZA) {
    return {
      id,
      de: 'topi',
      texto:
        'Esa no la tengo cargada todavía, y prefiero no inventarte una respuesta. Agenda la videollamada de diagnóstico y te la contestamos en persona, sin costo.',
      sinRespuesta: true,
    }
  }

  return {
    id,
    de: 'topi',
    texto: mejor.faq.respuesta,
    relacionadas: resultados.slice(1, 3).map((r) => r.faq.pregunta),
  }
}

function Burbuja({ mensaje, onPregunta }: { mensaje: Mensaje; onPregunta: (p: string) => void }) {
  if (mensaje.de === 'yo') {
    return (
      <li className="flex justify-end">
        <p className="bg-marca max-w-[85%] rounded-3xl rounded-br-lg px-5 py-3.5 text-[0.95rem] leading-relaxed text-white sm:max-w-[75%]">
          {mensaje.texto}
        </p>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3.5">
      <Topi
        decorativo
        className="mt-0.5 hidden w-11 shrink-0 text-white sm:block"
      />
      <div className="min-w-0 max-w-[92%] sm:max-w-[80%]">
        <div className="rounded-3xl rounded-tl-lg border border-white/10 bg-white/[0.04] px-5 py-4">
          <p className="text-[0.95rem] leading-relaxed text-foreground/90">
            {mensaje.texto}
          </p>

          {mensaje.sinRespuesta ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <BotonCta tamano="chico" texto="Agendar diagnóstico gratis" />
              <a
                href={`https://wa.me/${CONTACTO.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                O escríbenos por WhatsApp
              </a>
            </div>
          ) : null}
        </div>

        {mensaje.relacionadas && mensaje.relacionadas.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {mensaje.relacionadas.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => onPregunta(p)}
                  className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-marca-magenta/50 hover:text-white"
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

/**
 * Chat con Topi. Ya no hay listado de preguntas frecuentes: el visitante
 * escribe su duda con sus palabras y Topi contesta desde la información
 * que tenemos cargada.
 */
export function Faq() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO])
  const [texto, setTexto] = useState('')

  const preguntar = (consulta: string) => {
    const limpia = consulta.trim()
    if (limpia.length < 3) return
    setMensajes((previos) => {
      const base = previos.length
      return [
        ...previos,
        { id: base, de: 'yo', texto: limpia },
        responder(limpia, base + 1),
      ]
    })
    setTexto('')
  }

  const arrancando = mensajes.length === 1

  return (
    <section id="faq" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Revelar className="text-center">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Tus dudas
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Pregúntale a <span className="text-marca">Topi</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Escribe tu duda con tus palabras, como se la dirías a una persona.
            Topi contesta con lo que tenemos cargado.
          </p>
        </Revelar>

        <Revelar delay={100} className="mt-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
            <ul
              aria-live="polite"
              aria-label="Conversación con Topi"
              className="flex flex-col gap-5"
            >
              {mensajes.map((m) => (
                <Burbuja key={m.id} mensaje={m} onPregunta={preguntar} />
              ))}
            </ul>

            {arrancando ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {SUGERENCIAS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => preguntar(s)}
                      className="rounded-full border border-white/12 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-marca-magenta/50 hover:text-white"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                preguntar(texto)
              }}
              className="mt-6 flex items-center gap-3"
            >
              <label htmlFor="pregunta-topi" className="sr-only">
                Escribe tu pregunta para Topi
              </label>
              <input
                id="pregunta-topi"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                placeholder="Ej. ¿cuánto cuesta una tienda en línea?"
                className="h-13 min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.04] px-5 text-[0.95rem] text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none"
              />
              <button
                type="submit"
                disabled={texto.trim().length < 3}
                aria-label="Enviar pregunta"
                className="bg-marca flex size-13 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <CornerDownLeft aria-hidden className="size-5" />
              </button>
            </form>
          </div>
        </Revelar>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <BotonCta />
          <p className="text-sm text-muted-foreground">
            Topi contesta lo que sabe. Lo que no, lo vemos en la videollamada.
          </p>
        </div>
      </div>
    </section>
  )
}
