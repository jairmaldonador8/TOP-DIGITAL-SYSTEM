import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { marcarIntroVista } from '../actions'
import { TourAgencia } from '@/components/agencia/tour-agencia'
import {
  NotificacionesAgencia,
  type ChatPendiente,
} from '@/components/chat/notificaciones-agencia'
import {
  Campanita,
  type AvisoCampanita,
} from '@/components/layout/campanita'
import type { ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { hoyEnMexico } from '@/lib/formato'
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

  // Campanita: mensajes sin responder + tareas vencidas, cada aviso con
  // enlace directo a su sección.
  const hoy = hoyEnMexico()
  const { count: vencidas } = await supabase
    .from('tareas')
    .select('id', { count: 'exact', head: true })
    .neq('estado', 'completada')
    .lt('fecha_limite', hoy)

  const avisos: AvisoCampanita[] = pendientes.map((chat) => ({
    id: `chat-${chat.clienteId}`,
    titulo: `${chat.negocio} te escribió`,
    detalle:
      chat.cantidad === 1
        ? '1 mensaje sin responder'
        : `${chat.cantidad} mensajes sin responder`,
    href: `/agencia/chats/${chat.clienteId}`,
    leida: false,
  }))
  if (vencidas) {
    avisos.push({
      id: 'tareas-vencidas',
      titulo: vencidas === 1 ? '1 tarea vencida' : `${vencidas} tareas vencidas`,
      detalle: 'Revísalas en Tareas',
      href: '/agencia/tareas',
      leida: false,
    })
  }
  const sinLeer =
    pendientes.reduce((suma, chat) => suma + chat.cantidad, 0) + (vencidas ?? 0)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar
        items={ELEMENTOS_AGENCIA}
        usuarioNombre={nombre}
        acciones={<Campanita avisos={avisos} sinLeer={sinLeer} />}
      />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      <NotificacionesAgencia pendientes={pendientes} miId={miId} />
      {actual.introVista ? null : <TourAgencia action={marcarIntroVista} />}
    </div>
  )
}
