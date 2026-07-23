import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Topbar } from '@/components/layout/topbar'
import type { ElementoNav } from '@/components/layout/sidebar'
import { destinoPorRol } from '@/lib/auth/redirect'
import { usuarioActual } from '@/lib/auth/usuario-actual'

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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar
        items={ELEMENTOS_EQUIPO}
        usuarioNombre={actual.nombre ?? 'Integrante'}
        negocioNombre="Equipo Top Digital"
      />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
