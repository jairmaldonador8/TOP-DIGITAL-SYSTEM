import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { BotonCambiarEstado } from '@/components/clientes/cambiar-estado'
import {
  ClienteFormDialog,
  type ClienteEditable,
} from '@/components/clientes/cliente-form'
import {
  EstadoClienteBadge,
  type EstadoCliente,
} from '@/components/clientes/estado-badge'
import { UsuarioFormDialog } from '@/components/clientes/usuario-form'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Cliente',
}

type Cliente = ClienteEditable & {
  estado: EstadoCliente
  es_agencia: boolean
  created_at: string
}

type FilaUsuario = {
  id: string
  nombre: string
  rol: 'admin' | 'cliente'
  created_at: string
}

const MONEDA = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const FECHA = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('clientes')
    .select(
      'id, nombre_negocio, contacto_nombre, email, telefono, presupuesto_ads, meta_facturacion, estado, es_agencia, notas, created_at'
    )
    .eq('id', id)
    .maybeSingle()

  const cliente = data as Cliente | null
  // La agencia misma no se administra como cliente.
  if (!cliente || cliente.es_agencia) notFound()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, created_at')
    .eq('cliente_id', cliente.id)
    .order('created_at', { ascending: true })

  const listaUsuarios = (usuarios ?? []) as FilaUsuario[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <nav aria-label="Migas de pan">
        <Link
          href="/agencia/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-4" />
          Clientes
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {cliente.nombre_negocio}
            </h1>
            <EstadoClienteBadge estado={cliente.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            Cliente desde el {FECHA.format(new Date(cliente.created_at))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClienteFormDialog cliente={cliente} />
          <BotonCambiarEstado
            clienteId={cliente.id}
            estado={cliente.estado}
            nombreNegocio={cliente.nombre_negocio}
          />
        </div>
      </header>

      <Tabs defaultValue="resumen" className="gap-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          {/* Se habilitan en las Tareas 8 y 9 */}
          <TabsTrigger value="leads" disabled>
            Leads
          </TabsTrigger>
          <TabsTrigger value="campanias" disabled>
            Campañas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Información del negocio</CardTitle>
              <CardDescription>
                Datos de contacto y objetivos. Visible solo para la agencia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Dato etiqueta="Persona de contacto">
                  {cliente.contacto_nombre ?? '—'}
                </Dato>
                <Dato etiqueta="Correo electrónico">
                  {cliente.email ?? '—'}
                </Dato>
                <Dato etiqueta="Teléfono">{cliente.telefono ?? '—'}</Dato>
                <Dato etiqueta="Presupuesto de ads">
                  {MONEDA.format(Number(cliente.presupuesto_ads))}
                </Dato>
                <Dato etiqueta="Meta de facturación">
                  {MONEDA.format(Number(cliente.meta_facturacion))}
                </Dato>
                <div className="sm:col-span-2">
                  <Dato etiqueta="Notas">
                    <span className="whitespace-pre-wrap">
                      {cliente.notas ?? '—'}
                    </span>
                  </Dato>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del portal</CardTitle>
              <CardDescription>
                Personas de {cliente.nombre_negocio} con acceso al portal.
              </CardDescription>
              <CardAction>
                <UsuarioFormDialog
                  clienteId={cliente.id}
                  nombreNegocio={cliente.nombre_negocio}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              {listaUsuarios.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Este cliente todavía no tiene usuarios. Agrega el primero
                  para darle acceso al portal.
                </p>
              ) : (
                <ul className="divide-y">
                  {listaUsuarios.map((usuario) => (
                    <li
                      key={usuario.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-xs font-semibold text-accent-lima"
                      >
                        {iniciales(usuario.nombre)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {usuario.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Alta el {FECHA.format(new Date(usuario.created_at))}
                        </p>
                      </div>
                      <span className="rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {usuario.rol === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2)
  return partes.map((parte) => parte[0]?.toUpperCase() ?? '').join('') || '?'
}
