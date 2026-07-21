'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartColumn,
  ChevronsUpDown,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { cerrarSesion } from '@/app/login/actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * Los íconos se referencian por nombre (string serializable) para que
 * los layouts —Server Components— puedan pasar los items como props sin
 * cruzar componentes por la frontera servidor/cliente.
 */
const ICONOS = {
  dashboard: LayoutDashboard,
  clientes: Users,
  campanias: Megaphone,
  tareas: ListChecks,
  leads: Target,
  chats: MessagesSquare,
  chat: MessageCircle,
  reportes: ChartColumn,
} satisfies Record<string, LucideIcon>

export type NombreIcono = keyof typeof ICONOS

export type ElementoNav = {
  icono: NombreIcono
  label: string
  href: string
}

type SidebarProps = {
  items: ElementoNav[]
  usuarioNombre: string
  /** Nombre del negocio (portal de cliente). Si falta, se asume la agencia. */
  negocioNombre?: string
}

/**
 * Elemento activo = aquel cuyo href es el prefijo más largo de la ruta
 * actual. Evita que «Dashboard» (/agencia) quede activo en /agencia/clientes.
 */
export function elementoActivo(
  items: ElementoNav[],
  pathname: string
): ElementoNav | null {
  return items.reduce<ElementoNav | null>((mejor, item) => {
    const coincide =
      pathname === item.href || pathname.startsWith(`${item.href}/`)
    if (!coincide) return mejor
    return !mejor || item.href.length > mejor.href.length ? item : mejor
  }, null)
}

export function iniciales(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
  return letras || '·'
}

export function Sidebar({ items, usuarioNombre, negocioNombre }: SidebarProps) {
  const pathname = usePathname()
  const activo = elementoActivo(items, pathname)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href={items[0]?.href ?? '/'}
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60"
        >
          <span
            aria-hidden
            className="bg-marca flex size-7 items-center justify-center rounded-lg text-xs font-extrabold text-white"
          >
            T
          </span>
          <span className="text-sm font-bold tracking-[0.22em] text-white">
            TOP&nbsp;DIGITAL
          </span>
        </Link>
      </div>

      {/* Navegación */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icono = ICONOS[item.icono]
            const esActivo = item.href === activo?.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={esActivo ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring/60',
                    esActivo
                      ? 'bg-marca font-semibold text-white'
                      : 'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icono
                    aria-hidden
                    className={cn(
                      'size-4.5 shrink-0 transition-colors',
                      esActivo
                        ? 'text-white'
                        : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bloque de usuario */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 aria-expanded:bg-sidebar-accent">
            <span aria-hidden className="bg-marca shrink-0 rounded-full p-[2px]">
              <span className="flex size-8 items-center justify-center rounded-full bg-sidebar text-xs font-bold text-white">
                {iniciales(usuarioNombre)}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {usuarioNombre}
              </span>
              <span className="block truncate text-xs">
                {negocioNombre ?? 'Agencia Top Digital'}
              </span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" sideOffset={8}>
            {/* GroupLabel de Base UI debe vivir dentro de un Group */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {usuarioNombre}
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
      </div>
    </div>
  )
}
