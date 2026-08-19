'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react'

import { enviarSolicitud } from '@/app/(sitio)/agendar/actions'
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
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-foreground"
      >
        {etiqueta}
      </label>
      {ayuda ? (
        <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const CLASES_CONTROL =
  'h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[0.95rem] text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none'

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-marca group inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold text-white shadow-[0_10px_44px_-10px_rgba(240,51,141,0.6)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Enviar y agendar mi videollamada'}
      {!pending ? (
        <ArrowRight
          aria-hidden
          className="size-5 transition-transform group-hover:translate-x-0.5"
        />
      ) : null}
    </button>
  )
}

/**
 * Formulario de diagnóstico. Pide lo necesario para llegar a la
 * videollamada sabiendo con quién hablamos: contacto, tamaño del negocio,
 * qué servicios le interesan y qué le está pasando hoy.
 */
export function FormularioDiagnostico() {
  const [estado, accion] = useActionState(enviarSolicitud, null)
  const errores: Errores = estado && !estado.ok ? estado.errores : {}
  const previos: Record<string, string> =
    estado && !estado.ok ? estado.valores : {}

  if (estado?.ok) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <Topi decorativo className="mx-auto w-24 text-white" />
        <CheckCircle2
          aria-hidden
          className="mx-auto mt-6 size-10 text-marca-magenta"
        />
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
    <form action={accion} className="space-y-10">
      {/* Trampa antispam: invisible para personas, irresistible para bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="sitio_web">No llenar</label>
        <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errores._form ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errores._form}
        </p>
      ) : null}

      <fieldset>
        <legend className="font-heading text-lg font-extrabold tracking-tight">
          1 · ¿Con quién hablamos?
        </legend>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Campo id="nombre" etiqueta="Nombre y apellidos" error={errores.nombre}>
            <input
              id="nombre"
              name="nombre"
              required
              autoComplete="name"
              defaultValue={previos.nombre}
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo id="email" etiqueta="Correo electrónico" error={errores.email}>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={previos.email}
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo
            id="telefono"
            etiqueta="WhatsApp"
            ayuda="Es por donde te contactamos primero."
            error={errores.telefono}
          >
            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              autoComplete="tel"
              placeholder="220 602 0831"
              defaultValue={previos.telefono}
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo id="empresa" etiqueta="Nombre de tu empresa" error={errores.empresa}>
            <input
              id="empresa"
              name="empresa"
              required
              autoComplete="organization"
              defaultValue={previos.empresa}
              className={CLASES_CONTROL}
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-heading text-lg font-extrabold tracking-tight">
          2 · Sobre tu negocio
        </legend>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Campo
            id="giro"
            etiqueta="¿A qué se dedica?"
            ayuda="Ej. restaurante, inmobiliaria, clínica dental."
            error={errores.giro}
          >
            <input
              id="giro"
              name="giro"
              required
              defaultValue={previos.giro}
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo
            id="sitio_actual"
            etiqueta="Sitio web o redes (opcional)"
            error={errores.sitio_actual}
          >
            <input
              id="sitio_actual"
              name="sitio_actual"
              placeholder="tunegocio.com o @tunegocio"
              defaultValue={previos.sitio_actual}
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo
            id="facturacion"
            etiqueta="Facturación mensual aproximada"
            error={errores.facturacion}
          >
            <select
              id="facturacion"
              name="facturacion"
              required
              defaultValue={previos.facturacion ?? ''}
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
            error={errores.es_dueno}
          >
            <select
              id="es_dueno"
              name="es_dueno"
              required
              defaultValue={previos.es_dueno ?? ''}
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
      </fieldset>

      <fieldset>
        <legend className="font-heading text-lg font-extrabold tracking-tight">
          3 · ¿Qué necesitas?
        </legend>
        <p className="mt-2 text-sm text-muted-foreground">
          Marca todo lo que te interese. En la llamada te decimos por dónde
          conviene empezar.
        </p>
        {errores.servicios ? (
          <p role="alert" className="mt-2 text-xs text-red-400">
            {errores.servicios}
          </p>
        ) : null}
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
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
                // Radio pequeño a propósito: con el `rounded-md` del tema
                // (que escala con --radius) la casilla parecía un radio, y
                // aquí se puede elegir más de un servicio.
                className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-white/25 peer-checked:border-marca-magenta peer-checked:bg-marca-magenta peer-checked:[&>svg]:opacity-100"
              >
                <Check className="size-3.5 text-white opacity-0" />
              </span>
              <span className="text-sm font-medium">{servicio.etiqueta}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Campo
            id="problema"
            etiqueta="¿Qué está pasando hoy en tu negocio?"
            ayuda="Mientras más concreto, mejor preparamos la llamada."
            error={errores.problema}
            ancho="completo"
          >
            <textarea
              id="problema"
              name="problema"
              required
              rows={5}
              defaultValue={previos.problema}
              className={`${CLASES_CONTROL} h-auto resize-y py-3.5`}
            />
          </Campo>

          <Campo
            id="presupuesto"
            etiqueta="Presupuesto que tienes en mente"
            error={errores.presupuesto}
          >
            <select
              id="presupuesto"
              name="presupuesto"
              required
              defaultValue={previos.presupuesto ?? ''}
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
            etiqueta="¿Cuándo te gustaría empezar?"
            error={errores.arranque}
          >
            <select
              id="arranque"
              name="arranque"
              required
              defaultValue={previos.arranque ?? ''}
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
      </fieldset>

      <div className="flex flex-col items-start gap-4 border-t border-white/10 pt-8">
        <BotonEnviar />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Al enviar aceptas que te contactemos por WhatsApp o correo para
          agendar la videollamada. No compartimos tus datos con nadie.
        </p>
      </div>
    </form>
  )
}
