'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

import { BotonCta } from '@/components/sitio/cta'
import { Topi } from '@/components/sitio/marca'
import { Revelar } from '@/components/sitio/revelar'
import { buscarFaqs, UMBRAL_CONFIANZA } from '@/lib/sitio/buscar-faq'
import { FAQS } from '@/lib/sitio/contenido'

const SUGERENCIAS = [
  '¿Cuánto cuesta una página web?',
  '¿En cuánto tiempo veo resultados?',
  '¿Hay permanencia forzosa?',
]

/**
 * Preguntas frecuentes con buscador: el visitante escribe su duda con sus
 * palabras y Topi contesta con la respuesta cargada que mejor coincide. Si
 * no hay una buena coincidencia, lo manda a la videollamada en lugar de
 * inventar una respuesta.
 */
export function Faq() {
  const [consulta, setConsulta] = useState('')
  const [abierta, setAbierta] = useState<number | null>(0)

  const resultados = useMemo(() => buscarFaqs(consulta), [consulta])
  const buscando = consulta.trim().length > 2
  const mejor = resultados[0]
  const acierto = buscando && mejor && mejor.puntaje >= UMBRAL_CONFIANZA
  const relacionadas = acierto ? resultados.slice(1, 3) : []

  return (
    <section id="faq" className="border-t border-white/10 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <Revelar className="text-center">
          <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Preguntas frecuentes
          </p>
          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Pregúntale a <span className="text-marca">Topi</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Escribe tu duda con tus palabras. Topi busca entre todas nuestras
            respuestas y te da la que corresponde.
          </p>
        </Revelar>

        <Revelar delay={100} className="mt-10">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Ej. ¿cuánto cuesta una tienda en línea?"
              aria-label="Escribe tu pregunta"
              className="h-16 w-full rounded-full border border-white/12 bg-white/[0.04] pr-6 pl-14 text-base text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none"
            />
          </div>

          {!buscando ? (
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setConsulta(s)}
                    className="rounded-full border border-white/12 px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-marca-magenta/50 hover:text-white"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Revelar>

        {/* Respuesta de Topi */}
        {buscando ? (
          <div className="mt-8">
            <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <Topi
                decorativo
                className="mt-1 hidden w-16 shrink-0 text-white sm:block"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-marca-magenta uppercase">
                  Topi responde
                </p>
                {acierto ? (
                  <>
                    <h3 className="font-heading mt-3 text-lg font-extrabold">
                      {mejor.faq.pregunta}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {mejor.faq.respuesta}
                    </p>
                    {relacionadas.length > 0 ? (
                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="text-xs text-muted-foreground">
                          También podría interesarte:
                        </p>
                        <ul className="mt-2.5 space-y-1.5">
                          {relacionadas.map(({ faq }) => (
                            <li key={faq.pregunta}>
                              <button
                                type="button"
                                onClick={() => setConsulta(faq.pregunta)}
                                className="text-left text-sm text-foreground/80 underline-offset-4 transition-colors hover:text-white hover:underline"
                              >
                                {faq.pregunta}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      Esa no la tengo cargada todavía — y prefiero no
                      inventarte una respuesta. Agenda la videollamada de
                      diagnóstico y te la contestamos en persona, sin costo.
                    </p>
                    <div className="mt-6">
                      <BotonCta tamano="chico" texto="Agendar diagnóstico gratis" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Listado completo, siempre disponible */}
        <div className="mt-12">
          <h3 className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Todas las preguntas
          </h3>
          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((faq, i) => {
              const activa = abierta === i
              return (
                <li key={faq.pregunta}>
                  <h4>
                    <button
                      type="button"
                      onClick={() => setAbierta(activa ? null : i)}
                      aria-expanded={activa}
                      className="flex w-full items-center justify-between gap-5 py-5 text-left"
                    >
                      <span className="font-semibold">{faq.pregunta}</span>
                      <ChevronDown
                        aria-hidden
                        className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                          activa ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </h4>
                  {activa ? (
                    <p className="pb-6 leading-relaxed text-muted-foreground">
                      {faq.respuesta}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <BotonCta />
          <Link
            href="/servicios"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            O revisa los servicios primero
          </Link>
        </div>
      </div>
    </section>
  )
}
