'use client'

import * as React from 'react'
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  MegaphoneIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { cambiarEstadoCampania } from '@/app/(app)/agencia/campanias/actions'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { EstadoCampania } from '@/lib/campanias/tipos'
import { formatoFechaCorta, formatoMoneda } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type CampaniaView = {
  id: string
  nombre: string
  plataforma: string | null
  estado: EstadoCampania
  fecha_inicio: string | null
  cliente: string
  clienteId: string
  gasto: number | null
  /** Número que se muestra: CRM en manuales, Meta en sincronizadas. */
  leads: number
  ganados: number
  /** Id de la campaña en Meta; null cuando es manual. */
  metaCampaignId: string | null
  /** Cuenta publicitaria del cliente ("act_…") o null. */
  cuentaMeta: string | null
  /** Leads ligados en el CRM (métrica secundaria en sincronizadas). */
  leadsCrm: number
}

/** URL del Ads Manager de la cuenta ("act_123" → act=123). */
function urlAdsManager(cuentaMeta: string): string {
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${cuentaMeta.replace(/^act_/, '')}`
}

/**
 * Aviso para campañas sincronizadas: su estado es solo lectura aquí
 * (pausar, archivar o restaurar se revertiría en la próxima
 * sincronización); el cambio real se hace en el Ads Manager.
 */
function AvisoMetaDialog({
  abierto,
  onOpenChange,
  cuentaMeta,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  cuentaMeta: string | null
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Se administra desde Meta</AlertDialogTitle>
          <AlertDialogDescription>
            Esta campaña se administra desde Meta Ads Manager; los cambios de
            estado hechos aquí se revertirían en la próxima sincronización.
            Haz el cambio directamente en el Ads Manager.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>
            Entendido
          </AlertDialogClose>
          {cuentaMeta ? (
            <Button
              render={
                <a
                  href={urlAdsManager(cuentaMeta)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Abrir Ads Manager
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** "Deshacer" del toast al archivar: regresa la campaña a su estado. */
async function desarchivar(id: string, estado: Exclude<EstadoCampania, 'archivada'>) {
  const resultado = await cambiarEstadoCampania(id, estado)
  if (resultado.ok) toast.success('Campaña restaurada')
  else toast.error(resultado.mensaje)
}

/**
 * Tablero de campañas por cliente: píldoras para elegir cliente, tarjetas
 * con métricas (leads, ganados, gasto, costo por lead) y acciones de
 * pausar/reanudar/archivar; las archivadas viven en su sección colapsable.
 * Con `conFiltro=false` se usa dentro del detalle de un cliente: sin
 * píldoras y sin repetir el nombre del negocio en cada tarjeta.
 */
export function PanelCampanias({
  campanias,
  conFiltro = true,
}: {
  campanias: CampaniaView[]
  conFiltro?: boolean
}) {
  const [filtro, setFiltro] = React.useState<string | null>(null)

  const visibles = campanias.filter((c) => c.estado !== 'archivada')
  const archivadas = campanias.filter((c) => c.estado === 'archivada')

  // Píldoras: un cliente por cada uno que tenga campañas sin archivar.
  const clientes = [...new Map(visibles.map((c) => [c.clienteId, c.cliente]))]
    .map(([id, nombre]) => ({
      id,
      nombre,
      activas: visibles.filter(
        (c) => c.clienteId === id && c.estado === 'activa'
      ).length,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const filtradas = visibles
    .filter((c) => filtro === null || c.clienteId === filtro)
    .sort((a, b) =>
      a.estado === b.estado ? 0 : a.estado === 'activa' ? -1 : 1
    )

  const clasePildora = (activa: boolean) =>
    cn(
      'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
      activa
        ? 'bg-marca border-transparent font-semibold text-white'
        : 'border-border bg-sidebar text-muted-foreground hover:text-foreground'
    )

  return (
    <>
      {conFiltro && clientes.length > 0 ? (
        <div
          role="group"
          aria-label="Filtrar campañas por cliente"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setFiltro(null)}
            aria-pressed={filtro === null}
            className={clasePildora(filtro === null)}
          >
            Todos · {visibles.length}
          </button>
          {clientes.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => setFiltro(cliente.id)}
              aria-pressed={filtro === cliente.id}
              className={clasePildora(filtro === cliente.id)}
            >
              {cliente.nombre} · {cliente.activas}
            </button>
          ))}
        </div>
      ) : null}

      {filtradas.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <MegaphoneIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              {campanias.length === 0
                ? 'Aún no hay campañas'
                : 'Sin campañas aquí'}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {campanias.length === 0
                ? 'Abre la primera con el botón "Abrir campaña".'
                : 'Este cliente no tiene campañas sin archivar.'}
            </p>
          </div>
        </Card>
      ) : (
        // La key remonta el grid al cambiar de cliente: las tarjetas
        // entran en cascada.
        <div
          key={filtro ?? 'todos'}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtradas.map((campania, i) => (
            <TarjetaCampania
              key={`${campania.id}-${campania.estado}`}
              campania={campania}
              mostrarCliente={conFiltro && filtro === null}
              retrasoMs={i * 60}
            />
          ))}
        </div>
      )}

      {archivadas.length > 0 ? <Archivadas campanias={archivadas} /> : null}
    </>
  )
}

function TarjetaCampania({
  campania,
  mostrarCliente,
  retrasoMs,
}: {
  campania: CampaniaView
  mostrarCliente: boolean
  retrasoMs: number
}) {
  const [saliendo, setSaliendo] = React.useState(false)
  const [pendiente, setPendiente] = React.useState(false)
  const [avisoMeta, setAvisoMeta] = React.useState(false)
  const activa = campania.estado === 'activa'
  const sincronizada = campania.metaCampaignId != null
  const costoPorLead =
    campania.gasto != null && campania.gasto > 0 && campania.leads > 0
      ? campania.gasto / campania.leads
      : null
  const conversion =
    campania.leads > 0 ? campania.ganados / campania.leads : 0

  const alternarPausa = async () => {
    if (pendiente) return
    setPendiente(true)
    const resultado = await cambiarEstadoCampania(
      campania.id,
      activa ? 'pausada' : 'activa'
    )
    if (resultado.ok) {
      toast.success(activa ? 'Campaña pausada' : 'Campaña reanudada 🚀')
    } else {
      toast.error(resultado.mensaje)
    }
    setPendiente(false)
  }

  const archivar = () => {
    if (pendiente || saliendo) return
    setSaliendo(true)
    const estadoPrevio = campania.estado as Exclude<EstadoCampania, 'archivada'>
    window.setTimeout(async () => {
      const resultado = await cambiarEstadoCampania(campania.id, 'archivada')
      if (resultado.ok) {
        toast.success('Campaña archivada', {
          action: {
            label: 'Deshacer',
            onClick: () => void desarchivar(campania.id, estadoPrevio),
          },
        })
      } else {
        setSaliendo(false)
        toast.error(resultado.mensaje)
      }
    }, 350)
  }

  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 fill-mode-both gap-3 px-6 py-5 duration-500 will-change-transform',
        'transition-[opacity,transform,filter] ease-out',
        saliendo && 'scale-90 opacity-0 blur-sm',
        !activa && !saliendo && 'opacity-75 saturate-50'
      )}
      style={{ animationDelay: `${retrasoMs}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-semibold">{campania.nombre}</p>
            {sincronizada ? (
              <Badge variant="secondary" className="shrink-0">
                Meta
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {mostrarCliente ? `${campania.cliente} · ` : ''}
            {campania.plataforma ?? 'Sin plataforma'}
            {campania.fecha_inicio
              ? ` · desde ${formatoFechaCorta(campania.fecha_inicio)}`
              : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              'inline-flex h-5 items-center rounded-4xl px-2 text-xs font-medium',
              activa ? 'bg-marca text-white' : 'bg-muted text-muted-foreground'
            )}
          >
            {activa ? 'Activa' : 'Pausada'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 size-7"
                  aria-label={`Opciones de ${campania.nombre}`}
                />
              }
            >
              <EllipsisVerticalIcon aria-hidden className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem
                disabled={pendiente}
                onClick={() =>
                  // Las sincronizadas se administran desde Meta: aquí solo
                  // se avisa y se manda al Ads Manager.
                  sincronizada ? setAvisoMeta(true) : void alternarPausa()
                }
              >
                {activa ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
                {activa ? 'Pausar' : 'Reanudar'}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pendiente}
                onClick={() =>
                  sincronizada ? setAvisoMeta(true) : archivar()
                }
              >
                <ArchiveIcon aria-hidden />
                Archivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <div>
          <p className="text-xl font-bold tracking-tight">{campania.leads}</p>
          <p className="text-xs text-muted-foreground">
            leads
            {sincronizada && campania.leadsCrm > 0
              ? ` · ${campania.leadsCrm} en CRM`
              : ''}
          </p>
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">
            {campania.ganados}
          </p>
          <p className="text-xs text-muted-foreground">ganados</p>
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">
            {campania.gasto != null ? formatoMoneda(campania.gasto) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">gasto</p>
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">
            {costoPorLead != null ? formatoMoneda(costoPorLead) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">costo/lead</p>
        </div>
      </div>

      {/* Barra de conversión: qué fracción de los leads se ganó. */}
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-marca animar-crecer-x h-full rounded-full"
            style={{
              width: `${Math.round(conversion * 100)}%`,
              animationDelay: `${retrasoMs + 200}ms`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {campania.leads > 0
            ? `${Math.round(conversion * 100)}% de conversión`
            : 'Sin leads todavía'}
        </p>
      </div>

      {sincronizada ? (
        <AvisoMetaDialog
          abierto={avisoMeta}
          onOpenChange={setAvisoMeta}
          cuentaMeta={campania.cuentaMeta}
        />
      ) : null}
    </Card>
  )
}

function Archivadas({ campanias }: { campanias: CampaniaView[] }) {
  const [abierto, setAbierto] = React.useState(false)
  const [restaurando, setRestaurando] = React.useState<string | null>(null)
  const [avisoMeta, setAvisoMeta] = React.useState<CampaniaView | null>(null)

  const restaurar = async (campania: CampaniaView) => {
    if (restaurando) return
    // Sincronizada: el estado es de Meta; restaurarla aquí se revertiría
    // en la próxima sincronización.
    if (campania.metaCampaignId != null) {
      setAvisoMeta(campania)
      return
    }
    setRestaurando(campania.id)
    // Vuelve pausada: la agencia decide después si la reanuda.
    const resultado = await cambiarEstadoCampania(campania.id, 'pausada')
    if (resultado.ok) toast.success('Campaña restaurada (pausada)')
    else toast.error(resultado.mensaje)
    setRestaurando(null)
  }

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRightIcon
          aria-hidden
          className={cn(
            'size-4 transition-transform duration-300',
            abierto && 'rotate-90'
          )}
        />
        Archivadas · {campanias.length}
      </button>

      <div
        inert={!abierto}
        className={cn(
          'grid transition-[grid-template-rows] duration-500 ease-out',
          abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <Card className="py-2">
            <CardContent className="px-6">
              <ul className="flex flex-col divide-y divide-border">
                {campanias.map((campania) => (
                  <li
                    key={campania.id}
                    className={cn(
                      'flex items-center gap-3 py-4 transition-opacity duration-300',
                      restaurando === campania.id && 'opacity-40'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-muted-foreground">
                        {campania.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                        {campania.cliente}
                        {campania.plataforma ? ` · ${campania.plataforma}` : ''}
                        {' · '}
                        {campania.leads} leads
                        {campania.gasto != null
                          ? ` · ${formatoMoneda(campania.gasto)}`
                          : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={restaurando !== null}
                      onClick={() => void restaurar(campania)}
                    >
                      <ArchiveRestoreIcon data-icon="inline-start" />
                      Restaurar
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <AvisoMetaDialog
        abierto={avisoMeta !== null}
        onOpenChange={(sigueAbierto) => {
          if (!sigueAbierto) setAvisoMeta(null)
        }}
        cuentaMeta={avisoMeta?.cuentaMeta ?? null}
      />
    </section>
  )
}
