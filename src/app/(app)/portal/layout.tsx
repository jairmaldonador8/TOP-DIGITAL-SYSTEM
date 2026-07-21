import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  enviarMensajePortal,
  marcarMensajesLeidos,
  marcarNotificacionesLeidas,
} from './actions'
import { marcarIntroVista } from '../actions'
import { ChatFlotante } from '@/components/chat/chat-flotante'
import type { Mensaje } from '@/components/chat/hilo'
import {
  Campanita,
  type AvisoCampanita,
} from '@/components/layout/campanita'
import type { ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TourPortal } from '@/components/portal/tour-portal'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'Portal · Top Digital',
    template: '%s · Top Digital',
  },
}

// El chat no va en el nav: vive en el botón flotante de la esquina.
const ELEMENTOS_PORTAL: ElementoNav[] = [
  { icono: 'dashboard', label: 'Dashboard', href: '/portal' },
  { icono: 'leads', label: 'Mis Leads', href: '/portal/leads' },
  { icono: 'campanias', label: 'Campañas', href: '/portal/campanias' },
]

export default async function LayoutPortal({
  children,
}: {
  children: React.ReactNode
}) {
  // Defensa en profundidad: el proxy ya protege /portal, pero el layout
  // vuelve a verificar sesión y rol — el proxy no es frontera de seguridad.
  const actual = await usuarioActual()
  if (actual.rol !== 'cliente') {
    redirect(destinoPorRol(actual.claims ?? undefined))
  }

  const nombre = actual.nombre ?? 'Cliente'
  const negocio = actual.negocio
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null

  // Últimos mensajes para el chat flotante (la RLS limita al cliente propio).
  const supabase = await createClient()
  const { data: filas, error } = await supabase
    .from('mensajes')
    .select('id, autor_id, autor_nombre, texto, leido, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) console.error('Error al cargar mensajes del portal:', error)
  const mensajes = ((filas ?? []) as (Mensaje & { leido: boolean })[]).reverse()
  const noLeidos = mensajes.filter(
    (mensaje) => !mensaje.leido && mensaje.autor_id !== miId
  ).length

  // Campanita: últimas notificaciones (activaciones de campaña, avisos de
  // la agencia). Abrir el panel las marca como leídas.
  const { data: notifFilas, error: errorNotif } = await supabase
    .from('notificaciones')
    .select('id, texto, tipo, leida, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  if (errorNotif) console.error('Error al cargar notificaciones:', errorNotif)
  const notificaciones = notifFilas ?? []
  const avisos: AvisoCampanita[] = notificaciones.map((n) => ({
    id: n.id,
    titulo: n.texto,
    href: n.tipo === 'campania' ? '/portal/campanias' : '/portal',
    fecha: formatDistanceToNow(new Date(n.created_at), {
      addSuffix: true,
      locale: es,
    }),
    leida: n.leida,
  }))
  const notifSinLeer = notificaciones.filter((n) => !n.leida).length

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar
        items={ELEMENTOS_PORTAL}
        usuarioNombre={nombre}
        negocioNombre={negocio ?? 'Portal de cliente'}
        acciones={
          <Campanita
            avisos={avisos}
            sinLeer={notifSinLeer}
            alAbrir={marcarNotificacionesLeidas}
          />
        }
      />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      <ChatFlotante
        clienteId={actual.clienteId ?? ''}
        mensajes={mensajes}
        noLeidos={noLeidos}
        miId={miId}
        action={enviarMensajePortal}
        marcarLeidos={marcarMensajesLeidos}
      />
      {actual.introVista ? null : <TourPortal action={marcarIntroVista} />}
    </div>
  )
}
