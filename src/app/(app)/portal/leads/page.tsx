import type { Metadata } from 'next'
import { TargetIcon } from 'lucide-react'

import {
  EtapaBadge,
  ETIQUETAS_FUENTE,
  ETIQUETAS_INTERES,
  type EtapaLead,
} from '@/components/leads/badges'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatoFechaCorta } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Mis Leads',
}

type FilaLead = {
  id: string
  nombre: string
  telefono: string | null
  fuente: string
  etapa: EtapaLead
  interes: string | null
  created_at: string
}

export default async function PaginaLeadsPortal() {
  const supabase = await createClient()

  // La RLS limita la consulta a los leads del cliente de la sesión.
  const { data, error } = await supabase
    .from('leads')
    .select('id, nombre, telefono, fuente, etapa, interes, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('Error al cargar leads del portal:', error)
  const leads = (data ?? []) as FilaLead[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mis Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las personas interesadas en tu negocio.
        </p>
      </header>

      {error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar tus leads. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : leads.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <TargetIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Aún no tienes leads</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              En cuanto tus campañas generen interesados, aparecerán aquí.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Interés</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.telefono ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ETIQUETAS_FUENTE[lead.fuente] ?? lead.fuente}
                    </TableCell>
                    <TableCell>
                      <EtapaBadge etapa={lead.etapa} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.interes
                        ? (ETIQUETAS_INTERES[lead.interes] ?? lead.interes)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatoFechaCorta(lead.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
