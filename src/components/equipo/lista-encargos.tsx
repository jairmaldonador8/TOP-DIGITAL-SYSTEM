'use client'

import * as React from 'react'
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ClipboardListIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { avanzarEncargo } from '@/app/(app)/equipo/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  EstadoEncargo,
  PrioridadEncargo,
} from '@/lib/equipo/transiciones'
import { formatoFechaCorta, hoyEnMexico } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type EncargoView = {
  id: string
  titulo: string
  descripcion: string | null
  prioridad: PrioridadEncargo
  estado: EstadoEncargo
  fechaLimite: string | null
  comentarioRevision: string | null
  cliente: { nombre: string; giro: string | null; descripcion: string | null } | null
}

const ETIQUETA_ESTADO: Record<EstadoEncargo, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  entregado: 'En revisión',
  cambios: 'Cambios solicitados',
  aprobado: 'Aprobado',
}

const COLOR_PRIORIDAD: Record<PrioridadEncargo, string> = {
  alta: 'bg-red-500/15 text-red-500',
  media: 'bg-amber-500/15 text-amber-600 dark:text-amber-500',
  baja: 'bg-secondary text-muted-foreground',
}

function PrioridadBadge({ prioridad }: { prioridad: PrioridadEncargo }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-4xl px-2 text-xs font-semibold capitalize',
        COLOR_PRIORIDAD[prioridad]
      )}
    >
      {prioridad}
    </span>
  )
}

/** Botón principal según el estado del encargo (para el trabajador). */
function accionDe(estado: EstadoEncargo): {
  etiqueta: string
  a: 'en_progreso' | 'entregado'
} | null {
  if (estado === 'pendiente') return { etiqueta: 'Empezar', a: 'en_progreso' }
  if (estado === 'cambios') return { etiqueta: 'Retomar', a: 'en_progreso' }
  if (estado === 'en_progreso') return { etiqueta: 'Entregar', a: 'entregado' }
  return null
}

/**
 * Lista de encargos del trabajador agrupada por estado, con detalle en
 * dialog y el botón de avance del ciclo. Los aprobados viven colapsados.
 */
export function ListaEncargos({ encargos }: { encargos: EncargoView[] }) {
  const [abierto, setAbierto] = React.useState<EncargoView | null>(null)
  const [verAprobados, setVerAprobados] = React.useState(false)

  const activos = encargos.filter((e) => e.estado !== 'aprobado')
  const aprobados = encargos.filter((e) => e.estado === 'aprobado')
  const hoy = hoyEnMexico()

  if (encargos.length === 0) {
    return (
      <Card className="items-center gap-4 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <ClipboardListIcon aria-hidden className="size-5 text-marca-magenta" />
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sin encargos por ahora. Cuando te asignen trabajo aparecerá aquí.
        </p>
      </Card>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {activos.map((encargo, i) => {
          const vencido =
            encargo.fechaLimite !== null &&
            encargo.fechaLimite < hoy &&
            encargo.estado !== 'entregado'
          return (
            <li
              key={encargo.id}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <button
                type="button"
                onClick={() => setAbierto(encargo)}
                className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Card className="px-4 py-3.5 transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col gap-1.5 p-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold">
                        {encargo.titulo}
                      </p>
                      <PrioridadBadge prioridad={encargo.prioridad} />
                    </div>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {ETIQUETA_ESTADO[encargo.estado]}
                      </Badge>
                      {encargo.cliente ? (
                        <span className="truncate">{encargo.cliente.nombre}</span>
                      ) : null}
                      {encargo.fechaLimite ? (
                        <span className={cn(vencido && 'font-semibold text-destructive')}>
                          {vencido ? 'Venció ' : 'Entrega '}
                          {formatoFechaCorta(encargo.fechaLimite)}
                        </span>
                      ) : null}
                    </p>
                  </CardContent>
                </Card>
              </button>
            </li>
          )
        })}
      </ul>

      {aprobados.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setVerAprobados((v) => !v)}
            aria-expanded={verAprobados}
            className="flex cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronDownIcon
              aria-hidden
              className={cn('size-4 transition-transform', verAprobados && 'rotate-180')}
            />
            Aprobados ({aprobados.length})
          </button>
          {verAprobados ? (
            <ul className="mt-2 flex flex-col gap-2">
              {aprobados.map((encargo) => (
                <li key={encargo.id}>
                  <Card className="px-4 py-3 opacity-70">
                    <CardContent className="flex items-center gap-2 p-0 text-sm">
                      <CheckCircle2Icon
                        aria-hidden
                        className="size-4 shrink-0 text-emerald-500"
                      />
                      <span className="min-w-0 truncate">{encargo.titulo}</span>
                      {encargo.cliente ? (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {encargo.cliente.nombre}
                        </span>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <DetalleEncargo encargo={abierto} onCerrar={() => setAbierto(null)} />
    </>
  )
}

function DetalleEncargo({
  encargo,
  onCerrar,
}: {
  encargo: EncargoView | null
  onCerrar: () => void
}) {
  const [pendiente, iniciarTransicion] = React.useTransition()

  const avanzar = (a: 'en_progreso' | 'entregado') => {
    if (!encargo) return
    iniciarTransicion(async () => {
      const resultado = await avanzarEncargo(encargo.id, a)
      if (resultado.ok) {
        toast.success(
          a === 'entregado'
            ? 'Entregado — quedó en revisión con el dueño'
            : 'Encargo en progreso'
        )
        onCerrar()
      } else {
        toast.error(resultado.mensaje)
      }
    })
  }

  const accion = encargo ? accionDe(encargo.estado) : null

  return (
    <Dialog open={encargo !== null} onOpenChange={(abre) => !abre && onCerrar()}>
      <DialogContent>
        {encargo ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {encargo.titulo}
                <PrioridadBadge prioridad={encargo.prioridad} />
              </DialogTitle>
              <DialogDescription>
                {ETIQUETA_ESTADO[encargo.estado]}
                {encargo.fechaLimite
                  ? ` · Entrega ${formatoFechaCorta(encargo.fechaLimite)}`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            {encargo.estado === 'cambios' && encargo.comentarioRevision ? (
              <div
                role="alert"
                className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm"
              >
                <p className="font-semibold text-amber-600 dark:text-amber-500">
                  Cambios solicitados
                </p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {encargo.comentarioRevision}
                </p>
              </div>
            ) : null}

            {encargo.descripcion ? (
              <p className="text-sm whitespace-pre-wrap">{encargo.descripcion}</p>
            ) : null}

            {encargo.cliente ? (
              <div className="rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
                <p className="font-semibold">{encargo.cliente.nombre}</p>
                {encargo.cliente.giro ? (
                  <p className="text-xs text-muted-foreground">
                    {encargo.cliente.giro}
                  </p>
                ) : null}
                {encargo.cliente.descripcion ? (
                  <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground">
                    {encargo.cliente.descripcion}
                  </p>
                ) : null}
              </div>
            ) : null}

            {accion ? (
              <DialogFooter>
                <Button
                  disabled={pendiente}
                  onClick={() => avanzar(accion.a)}
                  className="w-full sm:w-auto"
                >
                  {pendiente ? 'Guardando…' : accion.etiqueta}
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
