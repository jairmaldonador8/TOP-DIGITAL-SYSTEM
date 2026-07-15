import type { Metadata } from 'next'
import { MegaphoneIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatoMoneda } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Campañas',
}

type FilaCampania = {
  id: string
  nombre: string
  plataforma: string | null
  estado: 'activa' | 'pausada'
  leads_generados: number
  clientes: { nombre_negocio: string } | null
}

export default async function PaginaCampaniasAgencia() {
  const supabase = await createClient()

  // Finanzas es tabla sensible (solo admin): consulta aparte del listado.
  const [campanias, finanzas] = await Promise.all([
    supabase
      .from('campanias')
      .select(
        'id, nombre, plataforma, estado, leads_generados, clientes ( nombre_negocio )'
      )
      .order('created_at', { ascending: false }),
    supabase.from('campania_finanzas').select('campania_id, gasto'),
  ])

  if (campanias.error) {
    console.error('Error al cargar campañas:', campanias.error)
  }
  const lista = (campanias.data ?? []) as unknown as FilaCampania[]
  const gastoPor = new Map(
    ((finanzas.data ?? []) as { campania_id: string; gasto: number }[]).map(
      (fila) => [fila.campania_id, fila.gasto]
    )
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Campañas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las campañas de tus clientes, con su gasto.
        </p>
      </header>

      {campanias.error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar las campañas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : lista.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <MegaphoneIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Aún no hay campañas</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Registra las campañas de tus clientes para darles seguimiento.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((campania) => {
            const gasto = gastoPor.get(campania.id)
            return (
              <Card key={campania.id} className="gap-3 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{campania.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {campania.clientes?.nombre_negocio ?? '—'}
                      {campania.plataforma ? ` · ${campania.plataforma}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-xs font-medium',
                      campania.estado === 'activa'
                        ? 'bg-marca text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {campania.estado === 'activa' ? 'Activa' : 'Pausada'}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      {campania.leads_generados}
                    </p>
                    <p className="text-xs text-muted-foreground">leads</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {gasto != null ? formatoMoneda(gasto) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">gasto</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
