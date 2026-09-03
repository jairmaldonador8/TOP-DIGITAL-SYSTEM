'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react'

import {
  agendarSolicitud,
  guardarContacto,
  guardarNegocio,
} from '@/app/(sitio)/agendar/actions'
import { Topi } from '@/components/sitio/marca'
import { CONTACTO } from '@/lib/sitio/contenido'
import {
  ARRANQUE,
  FACTURACION,
  PRESUPUESTO,
  SI_NO,
} from '@/lib/sitio/formulario'
import { SERVICIOS } from '@/lib/sitio/servicios'

type Errores = Record<string, string>

const PASOS = [
  { n: 1, nombre: 'Contacto', ayuda: 'Para saber con quién hablamos' },
  { n: 2, nombre: 'Tu negocio', ayuda: 'Para llegar preparados' },
  { n: 3, nombre: 'Tu proyecto', ayuda: 'Para saber por dónde empezar' },
]

const CLASES_CONTROL =
  'h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[0.95rem] text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none'

function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
  ancho = 'medio',
}: {
  id: string
  etiqueta: string
  ayuda?: string
  error?: string
  children: React.ReactNode
  ancho?: 'medio' | 'completo'
}) {
  return (
    <div className={ancho === 'completo' ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {etiqueta}
      </label>
      {ayuda ? <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Campo oculto que una persona nunca llena, pero un bot no resiste. */
function Trampa() {
  return (
    <div aria-hidden className="absolute -left-[9999px]">
      <label htmlFor="sitio_web">No llenar</label>
      <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}

function AvisoForm({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {mensaje}
    </p>
  )
}

function Boton({ texto, pendiente }: { texto: string; pendiente: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-marca group inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold text-white shadow-[0_10px_44px_-10px_rgba(240,51,141,0.6)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendiente : texto}
      {!pending ? (
        <ArrowRight
          aria-hidden
          className="size-5 transition-transform group-hover:translate-x-0.5"
        />
      ) : null}
    </button>
  )
}

function Barra({ actual }: { actual: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {PASOS.map((p) => {
        const hecho = actual > p.n
        const activo = actual === p.n
        return (
          <li
            key={p.n}
            aria-current={activo ? 'step' : undefined}
            className={`rounded-2xl border px-4 py-3.5 transition-colors ${
              activo
                ? 'border-marca-magenta/60 bg-marca-magenta/10'
                : hecho
                  ? 'border-white/12 bg-white/[0.03]'
                  : 'border-white/8 bg-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-extrabold ${
                  hecho
                    ? 'bg-marca-magenta text-white'
                    : activo
                      ? 'bg-marca text-white'
                      : 'border border-white/20 text-muted-foreground'
                }`}
              >
                {hecho ? <Check className="size-3.5" /> : p.n}
              </span>
              <span
                className={`text-sm font-semibold ${activo || hecho ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {p.nombre}
              </span>
            </div>
            <p className="mt-1.5 pl-[2.15rem] text-xs text-muted-foreground">
              {p.ayuda}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function Volver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-white"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Volver
    </button>
  )
}

/**
 * Formulario de diagnóstico en tres pasos.
 *
 * Cada paso guarda antes de avanzar: el contacto se escribe en la base
 * desde el paso 1, así que si alguien abandona a medio camino el equipo
 * conserva su WhatsApp y su correo. Los pasos 2 y 3 actualizan esa misma
 * solicitud, identificándose con el par id + token que devuelve el paso 1.
 *
 * El paso actual se DERIVA de los resultados de las acciones, no se guarda
 * en un efecto: la regla `react-hooks/set-state-in-effect` prohíbe el
 * setState síncrono en efectos y aquí no hace falta.
 */
export function FormularioDiagnostico() {
  const [rContacto, accionContacto] = useActionState(guardarContacto, null)
  const [rNegocio, accionNegocio] = useActionState(guardarNegocio, null)
  const [rFinal, accionFinal] = useActionState(agendarSolicitud, null)

  // Único estado propio: cuando el prospecto pide volver a un paso previo.
  const [retroceso, setRetroceso] = useState<number | null>(null)

  const credenciales =
    rNegocio?.ok === true ? rNegocio : rContacto?.ok === true ? rContacto : null

  const alcanzado = rNegocio?.ok ? 3 : rContacto?.ok ? 2 : 1
  const paso = retroceso ?? alcanzado

  const errContacto: Errores = rContacto && !rContacto.ok ? rContacto.errores : {}
  const prevContacto = rContacto && !rContacto.ok ? rContacto.valores : {}
  const errNegocio: Errores = rNegocio && !rNegocio.ok ? rNegocio.errores : {}
  const prevNegocio = rNegocio && !rNegocio.ok ? rNegocio.valores : {}
  const errFinal: Errores = rFinal && !rFinal.ok ? rFinal.errores : {}
  const prevFinal = rFinal && !rFinal.ok ? rFinal.valores : {}

  // Al enviar cualquier paso soltamos el retroceso para que el paso vuelva
  // a derivarse del avance real.
  const avanzar = () => setRetroceso(null)

  if (rFinal?.ok) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <Topi decorativo className="mx-auto w-24 text-white" />
        <CheckCircle2 aria-hidden className="mx-auto mt-6 size-10 text-marca-magenta" />
        <h2 className="font-heading mt-5 text-2xl font-extrabold tracking-tight">
          ¡Listo! Ya tenemos tus datos
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Te escribimos por WhatsApp dentro de las próximas 24 horas hábiles
          para acordar el día y la hora de tu videollamada.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          ¿Tienes prisa? Escríbenos directo:
        </p>
        <a
          href={`https://wa.me/${CONTACTO.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-marca-magenta/60"
        >
          {CONTACTO.whatsappVisible}
        </a>
        <p className="mt-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-white hover:underline"
          >
            Volver al inicio
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Barra actual={paso} />

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-9">
        {/* ─────────── paso 1 · contacto ─────────── */}
        {paso === 1 ? (
          <form action={accionContacto} onSubmit={avanzar} className="space-y-6">
            <Trampa />
            <div>
              <h2 className="font-heading text-xl font-extrabold tracking-tight">
                Empecemos por lo básico
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Con esto ya podemos buscarte. Son cuatro datos y sigues.
              </p>
            </div>

            <AvisoForm mensaje={errContacto._form} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="nombre" etiqueta="Nombre" error={errContacto.nombre}>
                <input
                  id="nombre"
                  name="nombre"
                  required
                  autoComplete="given-name"
                  defaultValue={prevContacto.nombre ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo id="apellido" etiqueta="Apellido" error={errContacto.apellido}>
                <input
                  id="apellido"
                  name="apellido"
                  required
                  autoComplete="family-name"
                  defaultValue={prevContacto.apellido ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo
                id="telefono"
                etiqueta="WhatsApp"
                ayuda="Ahí te escribimos para agendar."
                error={errContacto.telefono}
              >
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="220 602 0831"
                  defaultValue={prevContacto.telefono ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo
                id="email"
                etiqueta="Correo de la empresa"
                error={errContacto.email}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={prevContacto.email ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Boton texto="Continuar" pendiente="Guardando…" />
            </div>
          </form>
        ) : null}

        {/* ─────────── paso 2 · el negocio ─────────── */}
        {paso === 2 && credenciales ? (
          <form action={accionNegocio} onSubmit={avanzar} className="space-y-6">
            <Trampa />
            <input type="hidden" name="solicitud_id" value={credenciales.id} />
            <input type="hidden" name="solicitud_token" value={credenciales.token} />

            <div>
              <h2 className="font-heading text-xl font-extrabold tracking-tight">
                Cuéntanos de tu negocio
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tus datos ya quedaron guardados. Esto nos deja llegar a la
                llamada sabiendo de qué hablamos.
              </p>
            </div>

            <AvisoForm mensaje={errNegocio._form} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="empresa" etiqueta="Nombre de tu empresa" error={errNegocio.empresa}>
                <input
                  id="empresa"
                  name="empresa"
                  required
                  autoComplete="organization"
                  defaultValue={prevNegocio.empresa ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo
                id="giro"
                etiqueta="¿A qué se dedica?"
                error={errNegocio.giro}
              >
                <input
                  id="giro"
                  name="giro"
                  required
                  placeholder="Restaurante, clínica dental, inmobiliaria…"
                  defaultValue={prevNegocio.giro ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo
                id="sitio_actual"
                etiqueta="Sitio o redes"
                ayuda="Opcional, pero nos ayuda mucho."
                error={errNegocio.sitio_actual}
                ancho="completo"
              >
                <input
                  id="sitio_actual"
                  name="sitio_actual"
                  placeholder="tunegocio.com o @tunegocio"
                  defaultValue={prevNegocio.sitio_actual ?? ''}
                  className={CLASES_CONTROL}
                />
              </Campo>

              <Campo
                id="facturacion"
                etiqueta="Facturación mensual aproximada"
                error={errNegocio.facturacion}
              >
                <select
                  id="facturacion"
                  name="facturacion"
                  required
                  defaultValue={prevNegocio.facturacion ?? ''}
                  className={CLASES_CONTROL}
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {FACTURACION.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                id="es_dueno"
                etiqueta="¿Eres el dueño o quien decide?"
                error={errNegocio.es_dueno}
              >
                <select
                  id="es_dueno"
                  name="es_dueno"
                  required
                  defaultValue={prevNegocio.es_dueno ?? ''}
                  className={CLASES_CONTROL}
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {SI_NO.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Boton texto="Continuar" pendiente="Guardando…" />
              <Volver onClick={() => setRetroceso(1)} />
            </div>
          </form>
        ) : null}

        {/* ─────────── paso 3 · el proyecto ─────────── */}
        {paso === 3 && credenciales ? (
          <form action={accionFinal} onSubmit={avanzar} className="space-y-6">
            <Trampa />
            <input type="hidden" name="solicitud_id" value={credenciales.id} />
            <input type="hidden" name="solicitud_token" value={credenciales.token} />

            <div>
              <h2 className="font-heading text-xl font-extrabold tracking-tight">
                ¿Qué necesitas?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Último paso. Marca todo lo que te interese: en la llamada te
                decimos por dónde conviene empezar.
              </p>
            </div>

            <AvisoForm mensaje={errFinal._form} />

            {errFinal.servicios ? (
              <p role="alert" className="text-xs text-red-400">
                {errFinal.servicios}
              </p>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2">
              {SERVICIOS.map((servicio) => (
                <label
                  key={servicio.slug}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-marca-magenta/50 has-checked:border-marca-magenta has-checked:bg-marca-magenta/10"
                >
                  <input
                    type="checkbox"
                    name="servicios"
                    value={servicio.slug}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-white/25 peer-checked:border-marca-magenta peer-checked:bg-marca-magenta peer-checked:[&>svg]:opacity-100"
                  >
                    <Check className="size-3.5 text-white opacity-0" />
                  </span>
                  <span className="text-sm font-medium">{servicio.etiqueta}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="problema"
                etiqueta="¿Qué está pasando hoy en tu negocio?"
                ayuda="Mientras más concreto, mejor preparamos la llamada."
                error={errFinal.problema}
                ancho="completo"
              >
                <textarea
                  id="problema"
                  name="problema"
                  required
                  rows={4}
                  defaultValue={prevFinal.problema ?? ''}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.95rem] text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none"
                />
              </Campo>

              <Campo
                id="presupuesto"
                etiqueta="Presupuesto que tienes en mente"
                error={errFinal.presupuesto}
              >
                <select
                  id="presupuesto"
                  name="presupuesto"
                  required
                  defaultValue={prevFinal.presupuesto ?? ''}
                  className={CLASES_CONTROL}
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {PRESUPUESTO.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                id="arranque"
                etiqueta="¿Cuándo quieres arrancar?"
                error={errFinal.arranque}
              >
                <select
                  id="arranque"
                  name="arranque"
                  required
                  defaultValue={prevFinal.arranque ?? ''}
                  className={CLASES_CONTROL}
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {ARRANQUE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Boton
                texto="Agendar mi videollamada"
                pendiente="Agendando…"
              />
              <Volver onClick={() => setRetroceso(2)} />
            </div>
          </form>
        ) : null}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Guardamos tus datos desde el primer paso para poder buscarte aunque no
        termines. Nunca los compartimos con nadie.
      </p>
    </div>
  )
}
