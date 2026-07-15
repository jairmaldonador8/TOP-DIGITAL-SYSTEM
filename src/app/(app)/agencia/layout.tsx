import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import type { ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'

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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar items={ELEMENTOS_AGENCIA} usuarioNombre={nombre} />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
