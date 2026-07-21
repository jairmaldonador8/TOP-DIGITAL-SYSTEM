import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  NotificacionesAgencia,
  type ChatPendiente,
} from '@/components/chat/notificaciones-agencia'
import type { ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'Agencia · Top Digital',
    template: '%s · Top Digital',
  },
}

const ELEMENTOS_AGENCIA: ElementoNav[] = [
  { icono: 'dashboard', label: 'Dashboard', href: '/agencia' },
  { icono: 'clientes', label: 'Clientes', href: '/agencia/clientes' },
  { icono: 'campanias', label: 'Campañas', href: '/agencia/campanias' },
  { icono: 'tareas', label: 'Tareas', href: '/agencia/tareas' },
  { icono: 'leads', label: 'Leads', href: '/agencia/leads' },
  { icono: 'chats', label: 'Chats', href: '/agencia/chats' },
  { icono: 'reportes', label: 'Reportes', href: '/agencia/reportes' },
]

type FilaNoLeido = {
  cliente_id: string
  autor_id: string | null
  clientes:
    | { nombre_negocio: string }
    | { nombre_negocio: string }[]
    | null
}

export default async function LayoutAgencia({
  children,
}: {
  children: React.ReactNode
}) {
  // Defensa en profundidad: el proxy ya protege /agencia, pero el layout
  // vuelve a verificar sesión y rol — el proxy no es frontera de seguridad.
  const actual = await usuarioActual()
  if (actual.rol !== 'admin') {
    redirect(destinoPorRol(actual.claims ?? undefined))
  }

  const nombre = actual.nombre ?? 'Equipo Top Digital'
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null

  // Mensajes sin responder, agrupados por cliente (índice parcial de 0006).
  const supabase = await createClient()
  const { data: filas, error } = await supabase
    .from('mensajes')
    .select('cliente_id, autor_id, clientes ( nombre_negocio )')
    .eq('leido', false)
  if (error) console.error('Error al contar mensajes sin leer:', error)

  const porCliente = new Map<string, ChatPendiente>()
  for (const fila of (filas ?? []) as FilaNoLeido[]) {
    if (fila.autor_id !== null && fila.autor_id === miId) continue
    const relacion = fila.clientes
    const negocio = Array.isArray(relacion)
      ? (relacion[0]?.nombre_negocio ?? 'Cliente')
      : (relacion?.nombre_negocio ?? 'Cliente')
    const previo = porCliente.get(fila.cliente_id)
    porCliente.set(fila.cliente_id, {
      clienteId: fila.cliente_id,
      negocio,
      cantidad: (previo?.cantidad ?? 0) + 1,
    })
  }
  const pendientes = [...porCliente.values()]

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar items={ELEMENTOS_AGENCIA} usuarioNombre={nombre} />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      <NotificacionesAgencia pendientes={pendientes} miId={miId} />
    </div>
  )
}
