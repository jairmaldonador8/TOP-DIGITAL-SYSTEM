'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarPlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ClienteOpcionCita } from '@/components/agenda/cita-form'
import { AgendaDias, COLOR, ETIQUETA } from '@/components/calendario/agenda-dias'
import { FranjaSemana, sumarDias } from '@/components/calendario/franja-semana'
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

export type DiaCalendario = {
  fecha: string
  dia: number
  delMes: boolean
  esHoy: boolean
}

type Vista = 'agenda' | 'mes'

/**
 * Calendario de operación. En el celular abre en la agenda (franja de
 * semana + 7 días) con un control "Agenda | Mes"; en escritorio se ven
 * ambos. El grid, "hoy" y el día inicial llegan calculados del server
 * (hora de México) para no desfasar la hidratación.
 */
export function VistaCalendario({
  mes,
  mesEtiqueta,
  mesAnterior,
  mesSiguiente,
  hoy,
  diaInicial,
  dias,
  elementos,
  clientes,
  urlIcs,
}: {
  /** YYYY-MM del grid. */
  mes: string
  mesEtiqueta: string
  mesAnterior: string
  mesSiguiente: string
  hoy: string
  diaInicial: string
  dias: DiaCalendario[]
  elementos: ElementoCalendario[]
  clientes: ClienteOpcionCita[]
  urlIcs: string
}) {
  const router = useRouter()
  const [vista, setVista] = React.useState<Vista>('agenda')
  const [seleccionado, setSeleccionado] = React.useState(diaInicial)
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

  // Dentro del mes basta el estado; si la semana nueva cae en otro mes se
  // navega (igual que las flechas de mes) para traer sus elementos.
  const moverSemana = (semanas: 1 | -1) => {
    const destino = sumarDias(seleccionado, semanas * 7)
    const mesDestino = destino.slice(0, 7)
    if (mesDestino === mes) setSeleccionado(destino)
    else router.push(`/agencia/calendario?mes=${mesDestino}&dia=${destino}`)
  }

  const elegirEnMes = (fecha: string) => {
    setSeleccionado(fecha)
    setVista('agenda')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Mes anterior"
            render={<Link href={`/agencia/calendario?mes=${mesAnterior}`} />}
            nativeButton={false}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <p className="min-w-32 text-center text-sm font-semibold capitalize">
            {mesEtiqueta}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Mes siguiente"
            render={<Link href={`/agencia/calendario?mes=${mesSiguiente}`} />}
            nativeButton={false}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full px-4"
            render={<Link href="/agencia/calendario" />}
            nativeButton={false}
            // Si ya estamos en el mes de hoy la key no cambia: se regresa a mano.
            onClick={() => setSeleccionado(hoy)}
          >
            Hoy
          </Button>
        </div>
        <Button
          variant="outline"
          className="h-11 rounded-full px-4"
          onClick={() => setGoogleAbierto(true)}
        >
          <CalendarPlusIcon data-icon="inline-start" aria-hidden />
          <span className="sm:hidden">Google</span>
          <span className="hidden sm:inline">Ver en Google Calendar</span>
        </Button>
      </div>

      {/* Control segmentado: solo en móvil (en escritorio se ven ambas). */}
      <div
        role="tablist"
        aria-label="Vista del calendario"
        className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 lg:hidden"
      >
        {(['agenda', 'mes'] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="tab"
            aria-selected={vista === opcion}
            onClick={() => setVista(opcion)}
            className={cn(
              'h-11 rounded-full text-sm font-semibold transition-colors',
              vista === opcion
                ? 'bg-marca text-white shadow-md shadow-marca-magenta/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opcion === 'agenda' ? 'Agenda' : 'Mes'}
          </button>
        ))}
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

      {/* Grid del mes: tocar un día lo selecciona y abre su agenda. */}
      <Card
        className={cn(
          'gap-2 px-2 py-4 sm:px-4 lg:flex',
          vista === 'mes' ? 'flex' : 'hidden'
        )}
      >
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
                onClick={() => elegirEnMes(dia.fecha)}
                aria-pressed={dia.fecha === seleccionado}
                aria-label={`${formatoFechaCorta(dia.fecha)}: ${suyos.length} ${suyos.length === 1 ? 'elemento' : 'elementos'}`}
                className={cn(
                  'flex min-h-14 flex-col items-center gap-1 rounded-xl pt-1.5 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/60 sm:min-h-20 sm:items-stretch sm:px-1.5',
                  dia.delMes ? 'text-foreground' : 'text-muted-foreground/40',
                  dia.esHoy && 'ring-2 ring-marca-violeta/70',
                  dia.fecha === seleccionado && 'bg-muted'
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

      {/* Agenda: franja de semana (móvil) + 7 días desde el seleccionado. */}
      <div className={cn('flex-col gap-4 lg:flex', vista === 'agenda' ? 'flex' : 'hidden')}>
        <Card className="px-2 py-2 lg:hidden">
          <FranjaSemana
            seleccionado={seleccionado}
            hoy={hoy}
            conElementos={(fecha) => (porDia.get(fecha)?.length ?? 0) > 0}
            alElegir={setSeleccionado}
            alMoverSemana={moverSemana}
          />
        </Card>
        <AgendaDias desde={seleccionado} hoy={hoy} porDia={porDia} clientes={clientes} />
      </div>

      <GoogleDialog
        abierto={googleAbierto}
        onOpenChange={setGoogleAbierto}
        urlIcs={urlIcs}
      />
    </div>
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
            Suscríbete una vez y todo (campañas, entregas, tareas y citas)
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
                size="icon"
                className="size-11"
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
