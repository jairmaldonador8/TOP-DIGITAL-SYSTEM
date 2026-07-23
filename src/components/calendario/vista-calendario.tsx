'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CalendarPlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import { eliminarEvento } from '@/app/(app)/agencia/calendario/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ElementoCalendario, TipoElemento } from '@/lib/calendario/tipos'
import { formatoFechaCorta } from '@/lib/formato'
import { cn } from '@/lib/utils'

const COLOR: Record<TipoElemento, string> = {
  campania: 'bg-marca-violeta',
  encargo: 'bg-marca-magenta',
  tarea: 'bg-marca-naranja',
  evento: 'bg-sky-500',
}

const ETIQUETA: Record<TipoElemento, string> = {
  campania: 'Campaña',
  encargo: 'Entrega',
  tarea: 'Tarea',
  evento: 'Evento',
}

export type DiaCalendario = {
  fecha: string
  dia: number
  delMes: boolean
  esHoy: boolean
}

/**
 * Vista de mes + agenda del calendario de operación. El grid y los
 * elementos llegan calculados del server (hora de México); aquí solo hay
 * selección de día, detalle y el dialog de Google Calendar.
 */
export function VistaCalendario({
  mesEtiqueta,
  mesAnterior,
  mesSiguiente,
  dias,
  elementos,
  urlIcs,
}: {
  mesEtiqueta: string
  mesAnterior: string
  mesSiguiente: string
  dias: DiaCalendario[]
  elementos: ElementoCalendario[]
  urlIcs: string
}) {
  const [diaAbierto, setDiaAbierto] = React.useState<string | null>(null)
  const [googleAbierto, setGoogleAbierto] = React.useState(false)

  const porDia = React.useMemo(() => {
    const mapa = new Map<string, ElementoCalendario[]>()
    for (const elemento of elementos) {
      const lista = mapa.get(elemento.fecha) ?? []
      lista.push(elemento)
      mapa.set(elemento.fecha, lista)
    }
    return mapa
  }, [elementos])

  const delMes = elementos.filter((e) =>
    dias.some((d) => d.delMes && d.fecha === e.fecha)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mes anterior"
            render={<Link href={`/agencia/calendario?mes=${mesAnterior}`} />}
            nativeButton={false}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <p className="min-w-36 text-center text-sm font-semibold capitalize">
            {mesEtiqueta}
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mes siguiente"
            render={<Link href={`/agencia/calendario?mes=${mesSiguiente}`} />}
            nativeButton={false}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/agencia/calendario" />}
            nativeButton={false}
          >
            Hoy
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setGoogleAbierto(true)}>
          <CalendarPlusIcon data-icon="inline-start" aria-hidden />
          Ver en Google Calendar
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(Object.keys(COLOR) as TipoElemento[]).map((tipo) => (
          <span key={tipo} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-full', COLOR[tipo])} />
            {ETIQUETA[tipo]}
          </span>
        ))}
      </div>

      {/* Grid del mes */}
      <Card className="gap-2 px-3 py-4 sm:px-4">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, i) => (
            <span key={i}>{dia}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia) => {
            const suyos = porDia.get(dia.fecha) ?? []
            return (
              <button
                key={dia.fecha}
                type="button"
                disabled={suyos.length === 0}
                onClick={() => setDiaAbierto(dia.fecha)}
                aria-label={`${formatoFechaCorta(dia.fecha)}: ${suyos.length} ${suyos.length === 1 ? 'elemento' : 'elementos'}`}
                className={cn(
                  'flex min-h-14 flex-col items-center gap-1 rounded-lg pt-1.5 outline-none transition-colors sm:min-h-20 sm:items-stretch sm:px-1.5',
                  dia.delMes ? 'text-foreground' : 'text-muted-foreground/40',
                  suyos.length > 0 && 'cursor-pointer hover:bg-muted/50',
                  dia.esHoy && 'ring-2 ring-marca-violeta/70'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium sm:text-left',
                    dia.esHoy && 'font-bold text-marca-violeta'
                  )}
                >
                  {dia.dia}
                </span>
                {/* Móvil: puntitos. Desktop: chips con texto. */}
                <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                  {suyos.slice(0, 4).map((e) => (
                    <span
                      key={e.uid}
                      aria-hidden
                      className={cn('size-1.5 rounded-full', COLOR[e.tipo])}
                    />
                  ))}
                </span>
                <span className="hidden w-full flex-col gap-0.5 sm:flex">
                  {suyos.slice(0, 3).map((e) => (
                    <span
                      key={e.uid}
                      className={cn(
                        'truncate rounded px-1 py-px text-left text-[10px] font-medium text-white',
                        COLOR[e.tipo]
                      )}
                    >
                      {e.titulo}
                    </span>
                  ))}
                  {suyos.length > 3 ? (
                    <span className="text-left text-[10px] text-muted-foreground">
                      +{suyos.length - 3} más
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Agenda del mes */}
      <Card className="gap-3 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold">Agenda del mes</p>
        {delMes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin fechas este mes. Agrega un evento o asigna fechas a campañas,
            encargos y tareas.
          </p>
        ) : (
          <ul className="flex flex-col">
            {delMes.map((elemento) => (
              <FilaAgenda key={elemento.uid} elemento={elemento} />
            ))}
          </ul>
        )}
      </Card>

      {/* Detalle del día */}
      <Dialog
        open={diaAbierto !== null}
        onOpenChange={(abre) => !abre && setDiaAbierto(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {diaAbierto ? formatoFechaCorta(diaAbierto) : ''}
            </DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col">
            {(diaAbierto ? (porDia.get(diaAbierto) ?? []) : []).map(
              (elemento) => (
                <FilaAgenda key={elemento.uid} elemento={elemento} sinFecha />
              )
            )}
          </ul>
        </DialogContent>
      </Dialog>

      <GoogleDialog
        abierto={googleAbierto}
        onOpenChange={setGoogleAbierto}
        urlIcs={urlIcs}
      />
    </div>
  )
}

function FilaAgenda({
  elemento,
  sinFecha = false,
}: {
  elemento: ElementoCalendario
  sinFecha?: boolean
}) {
  const [pendiente, iniciarTransicion] = React.useTransition()

  const eliminar = () => {
    iniciarTransicion(async () => {
      const resultado = await eliminarEvento(elemento.id)
      if (resultado.ok) toast.success('Evento eliminado')
      else toast.error(resultado.mensaje)
    })
  }

  const contenido = (
    <>
      <span
        aria-label={ETIQUETA[elemento.tipo]}
        title={ETIQUETA[elemento.tipo]}
        role="img"
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', COLOR[elemento.tipo])}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {elemento.titulo}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[
            sinFecha ? null : formatoFechaCorta(elemento.fecha),
            elemento.hora,
            elemento.detalle,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </>
  )

  return (
    <li className="flex items-start gap-2.5 border-b border-border py-2.5 last:border-0">
      {elemento.tipo === 'evento' ? (
        <>
          {contenido}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Eliminar ${elemento.titulo}`}
            disabled={pendiente}
            onClick={eliminar}
          >
            <Trash2Icon aria-hidden className="text-muted-foreground" />
          </Button>
        </>
      ) : (
        <Link
          href={elemento.href}
          className="flex min-w-0 flex-1 items-start gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {contenido}
        </Link>
      )}
    </li>
  )
}

function GoogleDialog({
  abierto,
  onOpenChange,
  urlIcs,
}: {
  abierto: boolean
  onOpenChange: (abre: boolean) => void
  urlIcs: string
}) {
  const [copiado, setCopiado] = React.useState(false)

  const copiar = async () => {
    await navigator.clipboard.writeText(urlIcs)
    setCopiado(true)
    toast.success('URL copiada')
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ver en Google Calendar</DialogTitle>
          <DialogDescription>
            Suscríbete una vez y todo (campañas, entregas, tareas y eventos)
            aparecerá en tu Google Calendar, también en el celular.
          </DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
          <li>
            En{' '}
            <a
              href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-marca-violeta underline"
            >
              Google Calendar → Agregar por URL
            </a>{' '}
            pega esta dirección:
          </li>
          <li className="list-none">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary px-2.5 py-2 text-xs">
                {urlIcs}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Copiar URL"
                onClick={copiar}
              >
                {copiado ? (
                  <CheckIcon aria-hidden className="text-emerald-500" />
                ) : (
                  <CopyIcon aria-hidden />
                )}
              </Button>
            </div>
          </li>
          <li>Guarda — listo, el calendario «Top Digital» queda suscrito.</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Esta URL es privada: no la compartas. Google refresca la
          suscripción cada pocas horas.
        </p>
      </DialogContent>
    </Dialog>
  )
}
