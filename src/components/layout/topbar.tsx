'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'

import {
  elementoActivo,
  Sidebar,
  type ElementoNav,
} from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type TopbarProps = {
  items: ElementoNav[]
  usuarioNombre: string
  negocioNombre?: string
  /**
   * Acciones del lado derecho (p. ej. la campanita de notificaciones como
   * server component). Si se omite, se muestra la campana estática.
   */
  acciones?: React.ReactNode
}

export function Topbar({
  items,
  usuarioNombre,
  negocioNombre,
  acciones,
}: TopbarProps) {
  const pathname = usePathname()

  const titulo = elementoActivo(items, pathname)?.label ?? 'Panel'

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md lg:px-8">
      {/* Menú móvil: el sidebar se colapsa a un sheet lateral. La key por
          pathname desmonta (y cierra) el sheet al navegar a otra sección. */}
      <Sheet key={pathname}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 lg:hidden"
              aria-label="Abrir menú de navegación"
            />
          }
        >
          <Menu aria-hidden />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0 sm:max-w-[85vw]"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <Sidebar
            items={items}
            usuarioNombre={usuarioNombre}
            negocioNombre={negocioNombre}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold tracking-tight text-foreground">
          {titulo}
        </p>
      </div>

      {/* Campana de notificaciones: marcador estático hasta que el layout
          pase la campanita real vía `acciones` (tarea posterior). */}
      {acciones ?? (
        <Button variant="ghost" size="icon" aria-label="Notificaciones">
          <Bell aria-hidden />
        </Button>
      )}
    </header>
  )
}
