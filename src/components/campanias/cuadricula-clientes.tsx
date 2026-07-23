'use client'

import * as React from 'react'
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MegaphoneIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { cambiarEstadoCampania } from '@/app/(app)/agencia/campanias/actions'
import {
  DashboardCliente,
  type DatosDashboard,
} from '@/components/campanias/dashboard-cliente'
import { AvisoMetaDialog } from '@/components/campanias/panel-campanias'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Salud } from '@/lib/campanias/salud'
import type { EstadoCampania } from '@/lib/campanias/tipos'
import { formatoMoneda } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type CampaniaSemaforo = {
  id: string
  nombre: string
  estado: EstadoCampania
  salud: Salud
  esMeta: boolean
  conversaciones7d: number
  gasto7d: number
  /** gasto7d / conversaciones7d; null sin conversaciones. */
  cpl7d: number | null
  cuentaMeta: string | null
}

export type ClienteSemaforo = {
  id: string
  nombre: string
  activas: number
  verdes: number
  ambars: number
  rojas: number
  /** Activas o con actividad 7d, ya ordenadas rojo→ámbar→verde→gris. */
  recientes: CampaniaSemaforo[]
  /** El resto (histórico), para "Ver todas (N)". */
  historicas: CampaniaSemaforo[]
  /** KPIs, serie de 30 días y presupuesto — calculados en el server. */
  dashboard: DatosDashboard
}

const COLOR_PUNTO: Record<Salud, string> = {
  verde: 'bg-emerald-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-red-500',
  gris: 'bg-muted-foreground/50',
}

const ETIQUETA_SALUD: Record<Salud, string> = {
  verde: 'Va bien',
  ambar: 'Vigílala',
  rojo: 'Va mal',
  gris: 'Sin actividad',
}

function Punto({ salud }: { salud: Salud }) {
  return (
    <span
      role="img"
      aria-label={ETIQUETA_SALUD[salud]}
      title={ETIQUETA_SALUD[salud]}
      className={cn('size-2.5 shrink-0 rounded-full', COLOR_PUNTO[salud])}
    />
  )
}

/**
 * Vista de Campañas por cliente: cuadrícula con el pulso de cada negocio
 * (activas + semáforo de 7 días) y expansión in-place a sus campañas.
 * El semáforo llega calculado del servidor (salud.ts); aquí solo se pinta.
 */
export function CuadriculaClientes({
  clientes,
}: {
  clientes: ClienteSemaforo[]
}) {
  const [expandido, setExpandido] = React.useState<string | null>(null)

  const cliente = clientes.find((c) => c.id === expandido)
  if (cliente) {
    return (
      <DetalleCliente cliente={cliente} onVolver={() => setExpandido(null)} />
    )
  }

  if (clientes.length === 0) {
    return (
      <Card className="items-center gap-4 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <MegaphoneIcon aria-hidden className="size-5 text-marca-magenta" />
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          Da de alta clientes y vincula sus cuentas de Meta para ver aquí sus
          campañas.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {clientes.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setExpandido(c.id)}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-left outline-none duration-300 focus-visible:ring-2 focus-visible:ring-ring/60"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Card className="h-full justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">
                {c.nombre}
              </p>
              <span
                aria-label={`${c.activas} campañas activas`}
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  c.activas > 0
                    ? 'bg-marca text-white'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {c.activas}
              </span>
            </div>
            {c.verdes + c.ambars + c.rojas > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
                {c.rojas > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Punto salud="rojo" /> {c.rojas}
                  </span>
                ) : null}
                {c.ambars > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Punto salud="ambar" /> {c.ambars}
                  </span>
                ) : null}
                {c.verdes > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Punto salud="verde" /> {c.verdes}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {c.activas > 0 ? 'Sin gasto esta semana' : 'Sin campañas activas'}
              </p>
            )}
          </Card>
        </button>
      ))}
    </div>
  )
}

function DetalleCliente({
  cliente,
  onVolver,
}: {
  cliente: ClienteSemaforo
  onVolver: () => void
}) {
  // Las históricas (cientos en cuentas grandes) se montan hasta abrirse.
  const [verTodas, setVerTodas] = React.useState(false)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 duration-300">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden />
          Todos los clientes
        </Button>
        <p className="truncate text-sm font-semibold">{cliente.nombre}</p>
      </div>

      <DashboardCliente
        clienteId={cliente.id}
        datos={cliente.dashboard}
        activas={cliente.activas}
        miniSemaforo={{
          verdes: cliente.verdes,
          ambars: cliente.ambars,
          rojas: cliente.rojas,
        }}
        recientes={cliente.recientes}
      />

      {cliente.recientes.length === 0 ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Sin campañas activas ni actividad esta semana.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {cliente.recientes.map((campania) => (
            <FilaCampania key={campania.id} campania={campania} />
          ))}
        </ul>
      )}

      {cliente.historicas.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setVerTodas((v) => !v)}
            aria-expanded={verTodas}
            className="flex cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronDownIcon
              aria-hidden
              className={cn('size-4 transition-transform', verTodas && 'rotate-180')}
            />
            Ver todas ({cliente.historicas.length})
          </button>
          {verTodas ? (
            <ul className="mt-2 flex flex-col gap-2">
              {cliente.historicas.map((campania) => (
                <FilaCampania key={campania.id} campania={campania} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function FilaCampania({ campania }: { campania: CampaniaSemaforo }) {
  const [avisoMeta, setAvisoMeta] = React.useState(false)
  const [pendiente, setPendiente] = React.useState(false)
  const activa = campania.estado === 'activa'

  const cambiar = async (estado: EstadoCampania) => {
    if (pendiente) return
    setPendiente(true)
    const resultado = await cambiarEstadoCampania(campania.id, estado)
    setPendiente(false)
    if (resultado.ok) toast.success('Campaña actualizada')
    else toast.error(resultado.mensaje)
  }

  return (
    <li>
      <Card className="px-4 py-3">
        <CardContent className="flex items-center gap-3 p-0">
          <Punto salud={campania.salud} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              <span className="truncate">{campania.nombre}</span>
              {campania.esMeta ? (
                <Badge variant="secondary" className="shrink-0">
                  Meta
                </Badge>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {campania.conversaciones7d} conv. ·{' '}
              {formatoMoneda(campania.gasto7d)} esta semana
              {campania.cpl7d != null
                ? ` · ${formatoMoneda(campania.cpl7d)} por conv.`
                : ''}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Acciones de ${campania.nombre}`}
                  disabled={pendiente}
                />
              }
            >
              <EllipsisVerticalIcon aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {campania.esMeta ? (
                <DropdownMenuItem onClick={() => setAvisoMeta(true)}>
                  {activa ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
                  {activa ? 'Pausar' : 'Reanudar'}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => void cambiar(activa ? 'pausada' : 'activa')}
                  >
                    {activa ? (
                      <PauseIcon aria-hidden />
                    ) : (
                      <PlayIcon aria-hidden />
                    )}
                    {activa ? 'Pausar' : 'Reanudar'}
                  </DropdownMenuItem>
                  {campania.estado !== 'archivada' ? (
                    <DropdownMenuItem
                      onClick={() => void cambiar('archivada')}
                    >
                      <ArchiveIcon aria-hidden />
                      Archivar
                    </DropdownMenuItem>
                  ) : null}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
      <AvisoMetaDialog
        abierto={avisoMeta}
        onOpenChange={setAvisoMeta}
        cuentaMeta={campania.cuentaMeta}
      />
    </li>
  )
}
