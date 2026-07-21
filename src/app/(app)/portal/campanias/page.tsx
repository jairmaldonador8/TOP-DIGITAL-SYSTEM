import type { Metadata } from 'next'
import { MegaphoneIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { formatoFechaCorta } from '@/lib/formato'
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
  fecha_inicio: string | null
  leads_generados: number
}

export default async function PaginaCampaniasPortal() {
  const supabase = await createClient()

  // La RLS limita la consulta a las campañas del cliente. El gasto es
  // información sensible (solo admin) y no se muestra en el portal; las
  // archivadas tampoco: son historial interno de la agencia.
  const { data, error } = await supabase
    .from('campanias')
    .select('id, nombre, plataforma, estado, fecha_inicio, leads_generados')
    .neq('estado', 'archivada')
    .order('created_at', { ascending: false })

  if (error) console.error('Error al cargar campañas del portal:', error)
  const campanias = (data ?? []) as FilaCampania[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Campañas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las campañas que la agencia gestiona para tu negocio.
        </p>
      </header>

      {error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar tus campañas. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : campanias.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <MegaphoneIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Aún no hay campañas</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Cuando la agencia active campañas para tu negocio las verás
              aquí.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campanias.map((campania) => (
            <Card key={campania.id} className="gap-3 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{campania.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {campania.plataforma ?? 'Sin plataforma'}
                    {campania.fecha_inicio
                      ? ` · desde ${formatoFechaCorta(campania.fecha_inicio)}`
                      : ''}
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
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {campania.leads_generados}
                </p>
                <p className="text-xs text-muted-foreground">
                  leads generados
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
