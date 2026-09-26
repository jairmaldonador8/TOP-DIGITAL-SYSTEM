// src/app/(app)/agencia/(inicio)/page.tsx
import type { Metadata } from 'next'

import { BotonAgregar } from '@/components/agenda/mi-dia/boton-agregar'
import { EntregasEquipo } from '@/components/agenda/mi-dia/entregas-equipo'
import { LineaCitas } from '@/components/agenda/mi-dia/linea-citas'
import { ListaPendientes } from '@/components/agenda/mi-dia/lista-pendientes'
import { TarjetaDia } from '@/components/agenda/mi-dia/tarjeta-dia'
import { cargarDatosHojaAgregar } from '@/lib/agenda/hoja-server'
import { cargarMiDia } from '@/lib/agenda/mi-dia-server'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { formatoFechaLarga, hoyEnMexico } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mi día' }

export default async function PaginaMiDia() {
  const hoy = hoyEnMexico()
  const supabase = await createClient()
  const [actual, dia, hoja] = await Promise.all([
    usuarioActual(),
    cargarMiDia(supabase, hoy),
    cargarDatosHojaAgregar(supabase, hoy),
  ])
  const nombre = (actual.nombre ?? 'Tadeo').split(' ')[0]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Buen día, <span className="text-marca">{nombre}</span>
          </h1>
        </div>
        <BotonAgregar datos={hoja} />
      </header>
      <TarjetaDia conteo={dia.conteo} />
      <section aria-labelledby="t-citas" className="flex flex-col gap-2">
        <h2 id="t-citas" className="font-semibold">Citas</h2>
        <LineaCitas citas={dia.citas} datos={hoja} />
      </section>
      <section aria-labelledby="t-pend" className="flex flex-col gap-2">
        <h2 id="t-pend" className="font-semibold">Pendientes</h2>
        <ListaPendientes pendientes={dia.pendientes} />
      </section>
      <EntregasEquipo entregas={dia.entregas} />
    </div>
  )
}
