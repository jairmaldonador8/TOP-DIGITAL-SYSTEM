import type { Metadata } from 'next'

import {
  EventoFormDialog,
  type ClienteOpcionCal,
} from '@/components/calendario/evento-form'
import {
  VistaCalendario,
  type DiaCalendario,
} from '@/components/calendario/vista-calendario'
import { cargarElementos } from '@/lib/calendario/fuentes'
import { hoyEnMexico } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Calendario',
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/

const nombreMes = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

/** Aritmética de fechas anclada a mediodía UTC (patrón #418). */
function aDia(fecha: string): Date {
  return new Date(`${fecha}T12:00:00Z`)
}
function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** Grid lunes-domingo que cubre el mes completo (35 o 42 celdas). */
function diasDelGrid(mes: string, hoy: string): DiaCalendario[] {
  const primero = aDia(`${mes}-01`)
  // getUTCDay: 0=domingo; lunes como inicio de semana.
  const desfase = (primero.getUTCDay() + 6) % 7
  const inicio = aDia(`${mes}-01`)
  inicio.setUTCDate(inicio.getUTCDate() - desfase)

  const dias: DiaCalendario[] = []
  const cursor = new Date(inicio)
  do {
    const fecha = aISO(cursor)
    dias.push({
      fecha,
      dia: cursor.getUTCDate(),
      delMes: fecha.slice(0, 7) === mes,
      esHoy: fecha === hoy,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  } while (
    dias.length % 7 !== 0 ||
    aISO(cursor).slice(0, 7) === mes
  )
  return dias
}

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes: mesParam } = await searchParams
  const hoy = hoyEnMexico()
  const mes = mesParam && MES.test(mesParam) ? mesParam : hoy.slice(0, 7)

  const dias = diasDelGrid(mes, hoy)
  const desde = dias[0].fecha
  const hasta = dias[dias.length - 1].fecha

  const cursor = aDia(`${mes}-15`)
  cursor.setUTCMonth(cursor.getUTCMonth() - 1)
  const mesAnterior = aISO(cursor).slice(0, 7)
  cursor.setUTCMonth(cursor.getUTCMonth() + 2)
  const mesSiguiente = aISO(cursor).slice(0, 7)

  const supabase = await createClient()
  const [elementos, clientesRes] = await Promise.all([
    cargarElementos(supabase, desde, hasta),
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .eq('es_agencia', false)
      .order('nombre_negocio'),
  ])

  const urlIcs = `https://www.topdigital.company/api/calendario/ics?token=${process.env.ICS_SECRET ?? ''}`

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campañas, entregas del equipo, tareas y tus eventos — todo en una
            sola agenda.
          </p>
        </div>
        <EventoFormDialog
          clientes={(clientesRes.data ?? []) as ClienteOpcionCal[]}
        />
      </header>

      <VistaCalendario
        mesEtiqueta={nombreMes.format(aDia(`${mes}-01`))}
        mesAnterior={mesAnterior}
        mesSiguiente={mesSiguiente}
        dias={dias}
        elementos={elementos}
        urlIcs={urlIcs}
      />
    </div>
  )
}
