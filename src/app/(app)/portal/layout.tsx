import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Sidebar, type ElementoNav } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { destinoPorRol, rolDesdeClaims } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

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

/** Fila de usuarios con el join al negocio del cliente. */
type FilaUsuarioPortal = {
  nombre: string
  clientes:
    | { nombre_negocio: string }
    | { nombre_negocio: string }[]
    | null
}

export default async function LayoutPortal({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Defensa en profundidad: el proxy ya protege /portal, pero el layout
  // vuelve a verificar sesión y rol — el proxy no es frontera de seguridad.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || rolDesdeClaims(claims) !== 'cliente') {
    redirect(destinoPorRol(claims))
  }

  const { data: fila } = await supabase
    .from('usuarios')
    .select('nombre, clientes ( nombre_negocio )')
    .eq('user_id', claims.sub)
    .maybeSingle()

  const usuario = fila as FilaUsuarioPortal | null
  const nombre = usuario?.nombre ?? 'Cliente'
  const relacion = usuario?.clientes
  const negocio = Array.isArray(relacion)
    ? relacion[0]?.nombre_negocio
    : relacion?.nombre_negocio

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
