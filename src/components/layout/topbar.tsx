'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, Menu } from 'lucide-react'

import { cerrarSesion } from '@/app/login/actions'
import {
  elementoActivo,
  iniciales,
  Sidebar,
  type ElementoNav,
} from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

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

/**
 * Barra de navegación principal: logo con degradado de marca, píldoras de
 * sección al centro (desktop) y avatar con aro de degradado a la derecha.
 * En móvil las píldoras se colapsan a un drawer lateral (Sheet).
 */
export function Topbar({
  items,
  usuarioNombre,
  negocioNombre,
  acciones,
}: TopbarProps) {
  const pathname = usePathname()
  const activo = elementoActivo(items, pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md lg:px-8">
      {/* Menú móvil: la navegación se colapsa a un sheet lateral. La key
          por pathname desmonta (y cierra) el sheet al navegar. */}
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

      {/* Marca */}
      <Link
        href={items[0]?.href ?? '/'}
        className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span
          aria-hidden
          className="bg-marca flex size-8 items-center justify-center rounded-[10px] text-sm font-extrabold text-white"
        >
          T
        </span>
        <span className="hidden text-sm font-bold tracking-[0.22em] sm:block">
          TOP&nbsp;DIGITAL
        </span>
      </Link>

      {/* Píldoras de navegación (desktop) */}
      <nav
        aria-label="Navegación principal"
        className="hidden min-w-0 flex-1 justify-center lg:flex"
      >
        <ul
          data-tour="nav"
          className="flex items-center gap-1 rounded-full border border-border bg-sidebar p-1"
        >
          {items.map((item) => {
            const esActivo = item.href === activo?.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={esActivo ? 'page' : undefined}
                  className={cn(
                    'block rounded-full px-4 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                    esActivo
                      ? 'bg-marca font-semibold text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Título de la sección (solo móvil, donde no hay píldoras) */}
      <p className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight lg:hidden">
        {activo?.label ?? 'Panel'}
      </p>

      {/* Campana de notificaciones: marcador estático hasta que el layout
          pase la campanita real vía `acciones` (tarea posterior). */}
      {acciones ?? (
        <Button variant="ghost" size="icon" aria-label="Notificaciones">
          <Bell aria-hidden />
        </Button>
      )}

      {/* Usuario: avatar con aro de degradado + menú (desktop; en móvil el
          bloque de usuario vive en el drawer) */}
      <DropdownMenu>
        <DropdownMenuTrigger
          data-tour="cuenta"
          aria-label={`Cuenta de ${usuarioNombre}`}
          className="bg-marca hidden shrink-0 rounded-full p-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:block"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar text-xs font-bold">
            {iniciales(usuarioNombre)}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          {/* GroupLabel de Base UI debe vivir dentro de un Group */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">
              <span className="block">{usuarioNombre}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {negocioNombre ?? 'Agencia Top Digital'}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void cerrarSesion()}
          >
            <LogOut aria-hidden />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
