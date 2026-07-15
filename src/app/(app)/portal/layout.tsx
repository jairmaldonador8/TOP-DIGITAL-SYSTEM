import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Sidebar, type ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'

export const metadata: Metadata = {
  title: {
    default: 'Portal · Top Digital',
    template: '%s · Top Digital',
  },
}

const ELEMENTOS_PORTAL: ElementoNav[] = [
  { icono: 'dashboard', label: 'Dashboard', href: '/portal' },
  { icono: 'leads', label: 'Mis Leads', href: '/portal/leads' },
  { icono: 'campanias', label: 'Campañas', href: '/portal/campanias' },
  { icono: 'chat', label: 'Chat', href: '/portal/chat' },
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

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar
          items={ELEMENTOS_PORTAL}
          usuarioNombre={nombre}
          negocioNombre={negocio ?? 'Portal de cliente'}
        />
      </aside>
      <div className="flex min-h-svh flex-col lg:pl-64">
        <Topbar
          items={ELEMENTOS_PORTAL}
          usuarioNombre={nombre}
          negocioNombre={negocio ?? 'Portal de cliente'}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
