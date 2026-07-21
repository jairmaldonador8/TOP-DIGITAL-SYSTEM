'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'

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

export type AvisoCampanita = {
  id: string
  titulo: string
  detalle?: string
  href: string
  fecha?: string
  leida?: boolean
}

/**
 * Campana de notificaciones del topbar. Cada zona arma sus avisos en el
 * layout (server) y los pasa aquí; cada aviso lleva a su sección. `alAbrir`
 * (opcional, server action) se dispara al abrir el panel — el portal lo usa
 * para marcar las notificaciones como leídas.
 */
export function Campanita({
  avisos,
  sinLeer,
  alAbrir,
}: {
  avisos: AvisoCampanita[]
  sinLeer: number
  alAbrir?: () => Promise<void>
}) {
  return (
    <DropdownMenu
      onOpenChange={(abierto) => {
        if (abierto && alAbrir && sinLeer > 0) void alAbrir()
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            data-tour="campanita"
            className="relative"
            aria-label={
              sinLeer > 0
                ? `Notificaciones: ${sinLeer} sin leer`
                : 'Notificaciones'
            }
          />
        }
      >
        <Bell aria-hidden />
        {sinLeer > 0 ? (
          <span
            aria-hidden
            className="bg-marca animate-in zoom-in-50 absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white duration-300"
          >
            {sinLeer > 9 ? '9+' : sinLeer}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {avisos.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Todo al día ✨
          </p>
        ) : (
          avisos.map((aviso) => (
            <DropdownMenuItem
              key={aviso.id}
              render={<Link href={aviso.href} />}
              className="flex flex-col items-start gap-0.5 py-2.5"
            >
              <span className="flex w-full items-center gap-2">
                {aviso.leida === false ? (
                  <span
                    aria-hidden
                    className="bg-marca size-1.5 shrink-0 rounded-full"
                  />
                ) : null}
                <span className="truncate text-sm font-medium">
                  {aviso.titulo}
                </span>
              </span>
              {aviso.detalle ? (
                <span className="text-xs text-muted-foreground">
                  {aviso.detalle}
                </span>
              ) : null}
              {aviso.fecha ? (
                <span className="text-[11px] text-muted-foreground/70">
                  {aviso.fecha}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
