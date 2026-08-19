'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'

import { suscribir } from '@/app/(sitio)/agendar/actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-marca h-12 shrink-0 rounded-full px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Suscribirme'}
    </button>
  )
}

/** Alta al newsletter. Vive en la sección de redes y en el pie del sitio. */
export function Newsletter() {
  const [estado, accion] = useActionState(suscribir, null)

  if (estado?.ok) {
    return (
      <p className="flex items-center gap-2.5 rounded-full border border-marca-magenta/40 bg-marca-magenta/10 px-5 py-3 text-sm font-medium">
        <CheckCircle2 aria-hidden className="size-5 text-marca-magenta" />
        Listo, ya estás dentro. Nos vemos en tu correo.
      </p>
    )
  }

  const error = estado && !estado.ok ? estado.errores.email : undefined

  return (
    <form action={accion} className="w-full max-w-md">
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="nl-sitio-web">No llenar</label>
        <input id="nl-sitio-web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">
          Tu correo electrónico
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          placeholder="tu@correo.com"
          className="h-12 w-full rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-marca-violeta focus:outline-none"
        />
        <Boton />
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </form>
  )
}
