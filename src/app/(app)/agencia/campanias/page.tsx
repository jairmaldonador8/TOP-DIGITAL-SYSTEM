import type { Metadata } from 'next'

import {
  CampaniaFormDialog,
  type ClienteOpcion,
} from '@/components/campanias/campania-form'
import {
  PanelCampanias,
  type CampaniaView,
} from '@/components/campanias/panel-campanias'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Campañas',
}

type FilaCampaniaDb = {
  id: string
  nombre: string
  plataforma: string | null
  estado: 'activa' | 'pausada' | 'archivada'
  fecha_inicio: string | null
  leads_generados: number
  cliente_id: string
  clientes: { nombre_negocio: string } | null
}

export default async function PaginaCampaniasAgencia() {
  const supabase = await createClient()

  // Finanzas es tabla sensible (solo admin): consulta aparte del listado.
  const [campanias, finanzas, leads, clientesRes] = await Promise.all([
    supabase
      .from('campanias')
      .select(
        'id, nombre, plataforma, estado, fecha_inicio, leads_generados, cliente_id, clientes ( nombre_negocio )'
      )
      .order('created_at', { ascending: false }),
    supabase.from('campania_finanzas').select('campania_id, gasto'),
    supabase
      .from('leads')
      .select('campania_id, etapa')
      .not('campania_id', 'is', null),
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .order('nombre_negocio'),
  ])

  if (campanias.error) {
    console.error('Error al cargar campañas:', campanias.error)
  }

  const gastoPor = new Map(
    ((finanzas.data ?? []) as { campania_id: string; gasto: number }[]).map(
      (fila) => [fila.campania_id, fila.gasto]
    )
  )

  // Métricas reales desde la tabla de leads (ligados por campania_id).
  const statsPor = new Map<string, { total: number; ganados: number }>()
  for (const lead of (leads.data ?? []) as {
    campania_id: string
    etapa: string
  }[]) {
    const stats = statsPor.get(lead.campania_id) ?? { total: 0, ganados: 0 }
    stats.total += 1
    if (lead.etapa === 'ganado') stats.ganados += 1
    statsPor.set(lead.campania_id, stats)
  }

  const lista: CampaniaView[] = (
    (campanias.data ?? []) as unknown as FilaCampaniaDb[]
  ).map((campania) => {
    const stats = statsPor.get(campania.id)
    return {
      id: campania.id,
      nombre: campania.nombre,
      plataforma: campania.plataforma,
      estado: campania.estado,
      fecha_inicio: campania.fecha_inicio,
      cliente: campania.clientes?.nombre_negocio ?? '—',
      clienteId: campania.cliente_id,
      gasto: gastoPor.get(campania.id) ?? null,
      // Si aún no hay leads ligados, se muestra el contador manual.
      leads: stats?.total || campania.leads_generados,
      ganados: stats?.ganados ?? 0,
    }
  })

  const clientes = (clientesRes.data ?? []) as ClienteOpcion[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campañas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las campañas de cada cliente y cómo van.
          </p>
        </div>
        <CampaniaFormDialog clientes={clientes} />
      </header>

      {campanias.error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar las campañas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : (
        <PanelCampanias campanias={lista} />
      )}
    </div>
  )
}
