import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRightIcon, UsersRoundIcon } from 'lucide-react'

import { ClienteFormDialog } from '@/components/clientes/cliente-form'
import {
  EstadoClienteBadge,
  type EstadoCliente,
} from '@/components/clientes/estado-badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Clientes',
}

type FilaCliente = {
  id: string
  nombre_negocio: string
  contacto_nombre: string | null
  estado: EstadoCliente
}

export default async function PaginaClientes() {
  const supabase = await createClient()

  const { data: clientes, error: errorClientes } = await supabase
    .from('clientes')
    .select('id, nombre_negocio, contacto_nombre, estado')
    .eq('es_agencia', false)
    .order('created_at', { ascending: true })

  if (errorClientes) {
    console.error('Error al cargar clientes:', errorClientes)
  }

  const lista = (clientes ?? []) as FilaCliente[]

  // Conteo exacto por cliente con head:true (count en el header): consultas
  // en paralelo que no pueden truncarse por el max-rows de PostgREST.
  const conteos = await Promise.all(
    lista.map(async (cliente) => {
      const { count, error } = await supabase
        .from('leads')
        .select('cliente_id', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)
      if (error) {
        console.error(
          `Error al contar leads del cliente ${cliente.id}:`,
          error
        )
      }
      return [cliente.id, count ?? 0] as const
    })
  )
  const conteoLeads = new Map(conteos)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los negocios que administra Top Digital.
          </p>
        </div>
        <ClienteFormDialog />
      </header>

      {errorClientes ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar los clientes. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : lista.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <UsersRoundIcon aria-hidden className="size-5 text-marca-magenta" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Aún no hay clientes
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Crea el primer cliente con el botón “Nuevo cliente” para
              empezar a registrar sus leads y campañas.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Negocio</TableHead>
                <TableHead className="px-4">Contacto</TableHead>
                <TableHead className="px-4">Estado</TableHead>
                <TableHead className="px-4 text-right">Leads</TableHead>
                <TableHead className="w-10 px-4">
                  <span className="sr-only">Abrir perfil</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((cliente) => (
                <TableRow key={cliente.id} className="relative">
                  <TableCell className="px-4 py-3 font-medium">
                    <Link
                      href={`/agencia/clientes/${cliente.id}`}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {cliente.nombre_negocio}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {cliente.contacto_nombre ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <EstadoClienteBadge estado={cliente.estado} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    {conteoLeads.get(cliente.id) ?? 0}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    <ChevronRightIcon aria-hidden className="size-4" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
