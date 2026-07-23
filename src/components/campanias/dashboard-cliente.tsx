'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  SettingsIcon,
} from 'lucide-react'

import type { CampaniaSemaforo } from '@/components/campanias/cuadricula-clientes'
import { GraficaTendencia } from '@/components/campanias/grafica-tendencia'
import { Card } from '@/components/ui/card'
import type { Kpi, PuntoSerie } from '@/lib/campanias/metricas'
import { formatoMoneda } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type DatosDashboard = {
  serie: PuntoSerie[]
  kpis: { conversaciones: Kpi; gasto: Kpi; cpl: Kpi }
  gastoMes: number
  proyeccion: number | null
  presupuesto: number
}

/**
 * Mini-dashboard del cliente dentro de la expansión de Campañas: KPIs con
 * delta semanal, track de presupuesto del mes, tendencia de 30 días y top
 * de campañas de la semana. Solo pinta — todo llega calculado del server.
 */
export function DashboardCliente({
  clienteId,
  datos,
  activas,
  miniSemaforo,
  recientes,
}: {
  clienteId: string
  datos: DatosDashboard
  activas: number
  miniSemaforo: { verdes: number; ambars: number; rojas: number }
  recientes: CampaniaSemaforo[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TileKpi
          etiqueta="Conversaciones (7 días)"
          valor={String(datos.kpis.conversaciones.valor ?? 0)}
          delta={datos.kpis.conversaciones.deltaPct}
          subirEsBueno
        />
        <TileKpi
          etiqueta="Gasto (7 días)"
          valor={formatoMoneda(datos.kpis.gasto.valor ?? 0)}
          delta={datos.kpis.gasto.deltaPct}
          subirEsBueno={false}
        />
        <TileKpi
          etiqueta="Costo por conversación"
          valor={
            datos.kpis.cpl.valor != null
              ? formatoMoneda(datos.kpis.cpl.valor)
              : '—'
          }
          delta={datos.kpis.cpl.deltaPct}
          subirEsBueno={false}
        />
        <Card className="gap-1 px-4 py-4">
          <p className="text-xs text-muted-foreground">Campañas activas</p>
          <p className="text-2xl font-bold tracking-tight">{activas}</p>
          <p className="flex items-center gap-2.5 text-xs font-medium">
            {miniSemaforo.rojas > 0 ? (
              <span className="flex items-center gap-1">
                <span aria-hidden className="size-2 rounded-full bg-red-500" />
                {miniSemaforo.rojas}
              </span>
            ) : null}
            {miniSemaforo.ambars > 0 ? (
              <span className="flex items-center gap-1">
                <span aria-hidden className="size-2 rounded-full bg-amber-500" />
                {miniSemaforo.ambars}
              </span>
            ) : null}
            {miniSemaforo.verdes > 0 ? (
              <span className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-emerald-500"
                />
                {miniSemaforo.verdes}
              </span>
            ) : null}
            {miniSemaforo.rojas + miniSemaforo.ambars + miniSemaforo.verdes ===
            0 ? (
              <span className="text-muted-foreground">Sin gasto reciente</span>
            ) : null}
          </p>
        </Card>
      </div>

      <TrackPresupuesto
        clienteId={clienteId}
        gastoMes={datos.gastoMes}
        proyeccion={datos.proyeccion}
        presupuesto={datos.presupuesto}
      />

      <Card className="gap-3 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold">Últimos 30 días</p>
        <GraficaTendencia serie={datos.serie} />
      </Card>

      <TopCampanias recientes={recientes} />
    </div>
  )
}

function TileKpi({
  etiqueta,
  valor,
  delta,
  subirEsBueno,
}: {
  etiqueta: string
  valor: string
  delta: number | null
  subirEsBueno: boolean
}) {
  const bueno = delta !== null && (delta > 0) === subirEsBueno
  return (
    <Card className="gap-1 px-4 py-4">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="text-2xl font-bold tracking-tight">{valor}</p>
      {delta !== null ? (
        <p
          className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            // Sin cambio (0%): neutral, ni bueno ni malo.
            delta === 0
              ? 'text-muted-foreground'
              : bueno
                ? 'text-emerald-500'
                : 'text-red-500'
          )}
        >
          {delta >= 0 ? (
            <ArrowUpRightIcon aria-hidden className="size-3.5" />
          ) : (
            <ArrowDownRightIcon aria-hidden className="size-3.5" />
          )}
          {delta >= 0 ? '+' : ''}
          {delta}% <span className="font-normal text-muted-foreground">vs sem. anterior</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">sin semana previa</p>
      )}
    </Card>
  )
}

function TrackPresupuesto({
  clienteId,
  gastoMes,
  proyeccion,
  presupuesto,
}: {
  clienteId: string
  gastoMes: number
  proyeccion: number | null
  presupuesto: number
}) {
  if (presupuesto <= 0) {
    return (
      <Card className="flex-row items-center justify-between gap-3 px-4 py-3.5">
        <p className="text-sm text-muted-foreground">
          Configura su presupuesto mensual para dar seguimiento al gasto.
        </p>
        <Link
          href={`/agencia/clientes/${clienteId}`}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-marca-violeta outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <SettingsIcon aria-hidden className="size-3.5" />
          Configurar
        </Link>
      </Card>
    )
  }

  const pct = Math.min(100, (gastoMes / presupuesto) * 100)
  const excedera = proyeccion !== null && proyeccion > presupuesto
  return (
    <Card className="gap-2.5 px-4 py-4 sm:px-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Presupuesto del mes</p>
        <p className="text-xs text-muted-foreground">
          {formatoMoneda(gastoMes)} de {formatoMoneda(presupuesto)}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Gasto del mes: ${Math.round(pct)}% del presupuesto`}
        className="h-2.5 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700',
            pct >= 100
              ? 'bg-red-500'
              : excedera
                ? 'bg-amber-500'
                : 'bg-marca'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {pct >= 100 ? (
          <span className="font-medium text-red-500">
            Presupuesto agotado ({Math.round(pct)}%)
          </span>
        ) : excedera ? (
          <span className="font-medium text-amber-500">
            A este ritmo cerrará en ~{formatoMoneda(proyeccion)}
          </span>
        ) : (
          `Restante: ${formatoMoneda(presupuesto - gastoMes)}`
        )}
      </p>
    </Card>
  )
}

function TopCampanias({ recientes }: { recientes: CampaniaSemaforo[] }) {
  const top = recientes
    .filter((c) => c.gasto7d > 0 || c.conversaciones7d > 0)
    .sort((a, b) => b.gasto7d - a.gasto7d)
    .slice(0, 6)
  if (top.length === 0) return null

  const maxGasto = Math.max(...top.map((c) => c.gasto7d), 1)
  return (
    <Card className="gap-3 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold">Top campañas de la semana</p>
      <ul className="flex flex-col gap-2.5">
        {top.map((campania) => (
          <li key={campania.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-foreground">
                {campania.nombre}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {campania.conversaciones7d} conv. ·{' '}
                {formatoMoneda(campania.gasto7d)}
              </span>
            </div>
            <div
              aria-hidden
              className="h-1.5 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-marca"
                style={{ width: `${(campania.gasto7d / maxGasto) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
