import type { Metadata } from 'next'

import { BotonAgregar } from '@/components/agenda/mi-dia/boton-agregar'
import {
  VistaCalendario,
  type DiaCalendario,
  type Vista,
} from '@/components/calendario/vista-calendario'
import { cargarDatosHojaAgregar } from '@/lib/agenda/hoja-server'
import { cargarElementos } from '@/lib/calendario/fuentes'
import { hoyEnMexico } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Calendario',
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/
const DIA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const VISTA = /^(mes|agenda)$/

const nombreMes = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

/** Intl entrega "septiembre de 2026": solo la primera letra va en mayúscula. */
function capitalizarInicial(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Aritmética de fechas anclada a mediodía UTC (patrón #418). */
function aDia(fecha: string): Date {
  return new Date(`${fecha}T12:00:00Z`)
}
function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** Grid lunes-domingo que cubre el mes completo (28, 35 o 42 celdas). */
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
  searchParams: Promise<{ mes?: string; dia?: string; vista?: string }>
}) {
  const { mes: mesParam, dia: diaParam, vista: vistaParam } = await searchParams
  const hoy = hoyEnMexico()
  const mes = mesParam && MES.test(mesParam) ? mesParam : hoy.slice(0, 7)
  const vista: Vista = vistaParam && VISTA.test(vistaParam) ? (vistaParam as Vista) : 'agenda'

  const dias = diasDelGrid(mes, hoy)
  const desde = dias[0].fecha
  // La agenda lista 7 días desde el seleccionado: si es el último del
  // grid necesita 6 días más allá.
  const finAgenda = aDia(dias[dias.length - 1].fecha)
  finAgenda.setUTCDate(finAgenda.getUTCDate() + 6)
  const hasta = aISO(finAgenda)

  // Día seleccionado: ?dia= (flechas de semana) si cae en el grid; si no,
  // hoy cuando es el mes actual; si no, el día 1.
  const diaInicial =
    diaParam && DIA.test(diaParam) && dias.some((d) => d.fecha === diaParam)
      ? diaParam
      : hoy.slice(0, 7) === mes
        ? hoy
        : `${mes}-01`

  const cursor = aDia(`${mes}-15`)
  cursor.setUTCMonth(cursor.getUTCMonth() - 1)
  const mesAnterior = aISO(cursor).slice(0, 7)
  cursor.setUTCMonth(cursor.getUTCMonth() + 2)
  const mesSiguiente = aISO(cursor).slice(0, 7)

  const supabase = await createClient()
  const [elementos, hoja] = await Promise.all([
    cargarElementos(supabase, desde, hasta),
    cargarDatosHojaAgregar(supabase, hoy),
  ])

  const urlIcs = `https://www.topdigital.company/api/calendario/ics?token=${process.env.ICS_SECRET ?? ''}`

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campañas, entregas del equipo, tareas y tus citas — todo en una
            sola agenda.
          </p>
        </div>
        <BotonAgregar datos={hoja} inicial="cita" etiqueta="Agendar" />
      </header>

      {/* La key reinicia el día seleccionado al navegar de mes o semana. */}
      <VistaCalendario
        key={`${mes}-${diaInicial}`}
        mes={mes}
        mesEtiqueta={capitalizarInicial(nombreMes.format(aDia(`${mes}-01`)))}
        mesAnterior={mesAnterior}
        mesSiguiente={mesSiguiente}
        hoy={hoy}
        diaInicial={diaInicial}
        vistaInicial={vista}
        dias={dias}
        elementos={elementos}
        clientes={hoja.clientes}
        urlIcs={urlIcs}
      />
    </div>
  )
}
