'use client'

/**
 * Barra inferior de la zona agencia en móvil (< lg): Mi día · Calendario ·
 * + · Equipo · Más. Respeta el área segura del iPhone (requiere
 * viewportFit 'cover' en app/layout.tsx).
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Menu, Plus, Sun, UsersRound } from 'lucide-react'

import { HojaAgregar, type DatosHojaAgregar } from '@/components/agenda/hoja-agregar'
import { Sidebar, elementoActivo, type ElementoNav } from '@/components/layout/sidebar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const PRINCIPALES = [
  { href: '/agencia', label: 'Mi día', Icono: Sun },
  { href: '/agencia/calendario', label: 'Calendario', Icono: CalendarDays },
] as const
const SECUNDARIOS = [{ href: '/agencia/equipo', label: 'Equipo', Icono: UsersRound }] as const

// A nivel de módulo (no dentro del render): la regla
// react-hooks/static-components prohíbe crear componentes durante el render.
function Enlace({
  href, label, Icono, activo,
}: { href: string; label: string; Icono: typeof Sun; activo: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex min-w-14 flex-col items-center gap-1 py-1 text-[11px] font-medium',
        activo ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <Icono aria-hidden className={cn('size-6', activo && 'text-marca-magenta')} />
      {label}
    </Link>
  )
}

function MasTrigger() {
  return (
    <SheetTrigger
      render={
        <button
          type="button"
          className="flex min-w-14 flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground"
        />
      }
    >
      <Menu aria-hidden className="size-6" />
      Más
    </SheetTrigger>
  )
}

export function BarraInferior({
  items, usuarioNombre, datos,
}: {
  items: ElementoNav[]
  usuarioNombre: string
  datos: DatosHojaAgregar
}) {
  const pathname = usePathname()
  const activo = elementoActivo(items, pathname)
  const [agregar, setAgregar] = React.useState(false)

  return (
    <>
      <nav
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-end justify-around">
          {PRINCIPALES.map((e) => <Enlace key={e.href} {...e} activo={activo?.href === e.href} />)}
          <button
            type="button"
            onClick={() => setAgregar(true)}
            aria-label="Agregar cita, pendiente o encargo"
            className="bg-marca -mt-5 flex size-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-marca-magenta/30"
          >
            <Plus aria-hidden className="size-7" />
          </button>
          {SECUNDARIOS.map((e) => <Enlace key={e.href} {...e} activo={activo?.href === e.href} />)}
          {/* La key por pathname desmonta (y cierra) el menú al navegar. */}
          <Sheet key={pathname}>
            <MasTrigger />
            <SheetContent side="left" showCloseButton={false} className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0 sm:max-w-[85vw]">
              <SheetTitle className="sr-only">Más secciones</SheetTitle>
              <Sidebar items={items} usuarioNombre={usuarioNombre} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <HojaAgregar abierta={agregar} alCambiar={setAgregar} datos={datos} />
    </>
  )
}
