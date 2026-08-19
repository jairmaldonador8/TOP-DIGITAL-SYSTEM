import type { Metadata } from 'next'
import { Check } from 'lucide-react'

import { FormularioDiagnostico } from '@/components/sitio/formulario-diagnostico'
import { Revelar } from '@/components/sitio/revelar'

export const metadata: Metadata = {
  title: 'Agenda tu videollamada de diagnóstico gratis',
  description:
    'Cuéntanos qué está pasando en tu negocio y agendamos una videollamada de 30 minutos, sin costo y sin compromiso, para decirte qué te está frenando.',
}

const PROMESAS = [
  'Revisamos juntos tu situación actual y tus números',
  'Te decimos qué te está frenando, aunque no nos contrates',
  'Sales con un plan concreto de qué hacer primero',
  'Dura entre 30 y 45 minutos, por videollamada',
]

export default function Agendar() {
  return (
    <div className="relative overflow-hidden pt-32 pb-24 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-marca-violeta/18 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Revelar className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Videollamada de diagnóstico
            </p>
            <h1 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
              Cuéntanos qué pasa.
              <br />
              <span className="text-marca">Te decimos qué hacer.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Es gratis y sin compromiso. Llenar esto nos toma cinco minutos a
              ti y nos ahorra media llamada de preguntas básicas: llegamos
              sabiendo de qué hablar.
            </p>

            <ul className="mt-9 space-y-3.5">
              {PROMESAS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="bg-marca mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="size-3 text-white" />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-marca-naranja/40 bg-marca-naranja/10 px-4 py-2 text-sm font-semibold text-marca-naranja">
              <span aria-hidden className="size-1.5 rounded-full bg-marca-naranja" />
              Solo tomamos 1 cliente premium al mes
            </p>
          </Revelar>

          <Revelar delay={100}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10">
              <FormularioDiagnostico />
            </div>
          </Revelar>
        </div>
      </div>
    </div>
  )
}
