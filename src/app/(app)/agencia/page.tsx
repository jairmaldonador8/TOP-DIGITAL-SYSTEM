import type { Metadata } from 'next'

import { StatCard } from '@/components/paneles/stat-card'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { formatoFechaHora, formatoMoneda, inicioDeMes } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard',
}

type Actividad = {
  id: string
  texto: string
  created_at: string
  clientes: { nombre_negocio: string } | null
}

export default async function PaginaAgencia() {
  const actual = await usuarioActual()
  const nombre = actual.nombre ?? 'Equipo Top Digital'
  const supabase = await createClient()
  const desde = inicioDeMes()

  const [leadsMes, ganados, campanias, tareas, actividades] =
    await Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', desde),
      supabase
        .from('leads')
        .select('monto_venta')
        .eq('etapa', 'ganado')
        .gte('fecha_cierre', desde),
      supabase
        .from('campanias')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activa'),
      supabase
        .from('tareas')
        .select('id', { count: 'exact', head: true })
        .neq('estado', 'completada'),
      supabase
        .from('actividades')
        .select('id, texto, created_at, clientes ( nombre_negocio )')
        .order('created_at', { ascending: false })
        .limit(6),
    ])

  const ventasMes = ((ganados.data ?? []) as { monto_venta: number | null }[])
    .reduce((suma, lead) => suma + (lead.monto_venta ?? 0), 0)
  const listaActividades = (actividades.data ?? []) as unknown as Actividad[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hola, {nombre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Así va la agencia este mes.
        </p>
      </header>

      <div data-tour="metricas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          destacada
          titulo="Leads del mes"
          valor={String(leadsMes.count ?? 0)}
          href="/agencia/leads"
        />
        <StatCard
          titulo="Ventas cerradas"
          valor={formatoMoneda(ventasMes)}
          href="/agencia/reportes"
        />
        <StatCard
          titulo="Campañas activas"
          valor={String(campanias.count ?? 0)}
          href="/agencia/campanias"
        />
        <StatCard
          titulo="Tareas pendientes"
          valor={String(tareas.count ?? 0)}
          href="/agencia/tareas"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {listaActividades.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin actividad todavía. Aparecerá aquí conforme trabajes con tus
              clientes.
            </p>
          ) : (
            <ul className="flex flex-col">
              {listaActividades.map((actividad) => (
                <li
                  key={actividad.id}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-sm last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate">{actividad.texto}</p>
                    <p className="text-xs text-muted-foreground">
                      {actividad.clientes?.nombre_negocio ?? '—'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatoFechaHora(actividad.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
