import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  enviarMensajeEquipo,
  marcarMensajesEquipoLeidos,
} from './actions'
import { ChatFlotante } from '@/components/chat/chat-flotante'
import type { Mensaje } from '@/components/chat/hilo'
import { Topbar } from '@/components/layout/topbar'
import type { ElementoNav } from '@/components/layout/sidebar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'Mi trabajo · Top Digital',
    template: '%s · Top Digital',
  },
}

const ELEMENTOS_EQUIPO: ElementoNav[] = [
  { icono: 'dashboard', label: 'Mis encargos', href: '/equipo' },
]

export default async function LayoutEquipo({
  children,
}: {
  children: React.ReactNode
}) {
  // Defensa en profundidad: el proxy ya protege /equipo, pero el layout
  // vuelve a verificar sesión y rol — el proxy no es frontera de seguridad.
  const actual = await usuarioActual()
  if (actual.rol !== 'equipo') {
    redirect(destinoPorRol(actual.claims ?? undefined))
  }
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null

  // Hilo con el dueño (la RLS limita al hilo propio).
  const supabase = await createClient()
  const { data: filas, error } = await supabase
    .from('mensajes_equipo')
    .select('id, autor_id, autor_nombre, texto, leido, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) console.error('Error al cargar chat de equipo:', error)
  const mensajes = ((filas ?? []) as (Mensaje & { leido: boolean })[]).reverse()
  const noLeidos = mensajes.filter(
    (mensaje) => !mensaje.leido && mensaje.autor_id !== miId
  ).length

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar
        items={ELEMENTOS_EQUIPO}
        usuarioNombre={actual.nombre ?? 'Integrante'}
        negocioNombre="Equipo Top Digital"
      />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      <ChatFlotante
        clienteId=""
        topico={miId ? `chat:equipo:${miId}` : undefined}
        mensajes={mensajes}
        noLeidos={noLeidos}
        miId={miId}
        action={enviarMensajeEquipo}
        marcarLeidos={marcarMensajesEquipoLeidos}
      />
    </div>
  )
}
