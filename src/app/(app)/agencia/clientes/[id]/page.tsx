import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { CampaniaFormDialog } from '@/components/campanias/campania-form'
import {
  PanelCampanias,
  type CampaniaView,
} from '@/components/campanias/panel-campanias'
import { BotonCambiarEstado } from '@/components/clientes/cambiar-estado'
import {
  ClienteFormDialog,
  type ClienteEditable,
} from '@/components/clientes/cliente-form'
import { ConexionMeta } from '@/components/clientes/conexion-meta'
import {
  EstadoClienteBadge,
  type EstadoCliente,
} from '@/components/clientes/estado-badge'
import { UsuarioFormDialog } from '@/components/clientes/usuario-form'
import {
  EtapaBadge,
  ETIQUETAS_FUENTE,
  type EtapaLead,
} from '@/components/leads/badges'
import { TrackerProgreso } from '@/components/paneles/tracker-progreso'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatoFechaCorta, formatoMoneda } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Cliente',
}

type Cliente = ClienteEditable & {
  estado: EstadoCliente
  es_agencia: boolean
  meta_ad_account_id: string | null
  created_at: string
}

type FilaUsuario = {
  id: string
  nombre: string
  rol: 'admin' | 'cliente'
  created_at: string
}

type FilaLead = {
  id: string
  nombre: string
  fuente: string
  etapa: EtapaLead
  monto_venta: number | null
  fecha_cierre: string | null
  campania_id: string | null
  created_at: string
}

type FilaCampaniaDb = {
  id: string
  nombre: string
  plataforma: string | null
  estado: 'activa' | 'pausada' | 'archivada'
  fecha_inicio: string | null
  leads_generados: number
  meta_campaign_id: string | null
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

  const { data, error: errorCliente } = await supabase
    .from('clientes')
    .select(
      'id, nombre_negocio, contacto_nombre, email, telefono, presupuesto_ads, meta_facturacion, estado, es_agencia, meta_ad_account_id, notas, created_at'
    )
    .eq('id', id)
    .maybeSingle()

  // Un id que no es uuid también produce error (22P02): eso sí es un 404.
  if (errorCliente && errorCliente.code !== '22P02') {
    console.error('Error al cargar cliente:', errorCliente)
  }

  const cliente = data as Cliente | null
  // La agencia misma no se administra como cliente.
  if (!cliente || cliente.es_agencia) notFound()

  const [usuariosRes, leadsRes, campaniasRes, finanzasRes] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre, rol, created_at')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('leads')
      .select(
        'id, nombre, fuente, etapa, monto_venta, fecha_cierre, campania_id, created_at'
      )
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('campanias')
      .select(
        'id, nombre, plataforma, estado, fecha_inicio, leads_generados, meta_campaign_id'
      )
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('campania_finanzas')
      .select('campania_id, gasto')
      .eq('cliente_id', cliente.id),
  ])

  const errorUsuarios = usuariosRes.error
  if (errorUsuarios) {
    console.error('Error al cargar usuarios del cliente:', errorUsuarios)
  }
  if (leadsRes.error) {
    console.error('Error al cargar leads del cliente:', leadsRes.error)
  }
  if (campaniasRes.error) {
    console.error('Error al cargar campañas del cliente:', campaniasRes.error)
  }

  const listaUsuarios = (usuariosRes.data ?? []) as FilaUsuario[]
  const listaLeads = (leadsRes.data ?? []) as FilaLead[]

  // Métricas por campaña a partir de los leads ya consultados.
  const gastoPor = new Map(
    ((finanzasRes.data ?? []) as { campania_id: string; gasto: number }[]).map(
      (fila) => [fila.campania_id, fila.gasto]
    )
  )
  const statsPor = new Map<string, { total: number; ganados: number }>()
  for (const lead of listaLeads) {
    if (!lead.campania_id) continue
    const stats = statsPor.get(lead.campania_id) ?? { total: 0, ganados: 0 }
    stats.total += 1
    if (lead.etapa === 'ganado') stats.ganados += 1
    statsPor.set(lead.campania_id, stats)
  }
  const listaCampanias: CampaniaView[] = (
    (campaniasRes.data ?? []) as FilaCampaniaDb[]
  ).map((campania) => {
    const stats = statsPor.get(campania.id)
    const sincronizada = campania.meta_campaign_id != null
    return {
      id: campania.id,
      nombre: campania.nombre,
      plataforma: campania.plataforma,
      estado: campania.estado,
      fecha_inicio: campania.fecha_inicio,
      cliente: cliente.nombre_negocio,
      clienteId: cliente.id,
      gasto: gastoPor.get(campania.id) ?? null,
      // Sincronizada: manda el número de Meta y el CRM queda como métrica
      // secundaria. Manual: leads del CRM o, si no hay, el contador manual.
      leads: sincronizada
        ? campania.leads_generados
        : stats?.total || campania.leads_generados,
      ganados: stats?.ganados ?? 0,
      metaCampaignId: campania.meta_campaign_id,
      cuentaMeta: cliente.meta_ad_account_id,
      leadsCrm: sincronizada ? (stats?.total ?? 0) : 0,
    }
  })
  const campaniasSinArchivar = listaCampanias.filter(
    (campania) => campania.estado !== 'archivada'
  )

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
          <TabsTrigger value="leads">
            Leads{listaLeads.length > 0 ? ` · ${listaLeads.length}` : ''}
          </TabsTrigger>
          <TabsTrigger value="campanias">
            Campañas
            {campaniasSinArchivar.length > 0
              ? ` · ${campaniasSinArchivar.length}`
              : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="flex flex-col gap-4">
          <TrackerProgreso
            titulo={`Progreso de ${cliente.nombre_negocio}`}
            desde={cliente.created_at}
            meta={Number(cliente.meta_facturacion)}
            leads={listaLeads}
          />
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
          <ConexionMeta
            clienteId={cliente.id}
            metaAdAccountId={cliente.meta_ad_account_id}
          />
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
              {errorUsuarios ? (
                <p
                  role="alert"
                  className="py-6 text-center text-sm text-destructive"
                >
                  No se pudieron cargar los usuarios. Recarga la página para
                  intentarlo de nuevo.
                </p>
              ) : listaUsuarios.length === 0 ? (
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
                        className="bg-marca flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
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

        <TabsContent value="leads">
          <Card className="py-2">
            <CardContent className="px-2">
              {leadsRes.error ? (
                <p
                  role="alert"
                  className="py-6 text-center text-sm text-destructive"
                >
                  No se pudieron cargar los leads. Recarga la página para
                  intentarlo de nuevo.
                </p>
              ) : listaLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {cliente.nombre_negocio} todavía no tiene leads. Cuando
                  lleguen los verás aquí.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Venta</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listaLeads.slice(0, 100).map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.nombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ETIQUETAS_FUENTE[lead.fuente] ?? lead.fuente}
                        </TableCell>
                        <TableCell>
                          <EtapaBadge etapa={lead.etapa} />
                        </TableCell>
                        <TableCell className="text-right">
                          {lead.monto_venta != null
                            ? formatoMoneda(lead.monto_venta)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatoFechaCorta(lead.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campanias" className="flex flex-col gap-4">
          {campaniasRes.error ? (
            <Card className="items-center py-10 text-center">
              <p className="max-w-sm text-sm text-destructive" role="alert">
                No se pudieron cargar las campañas. Recarga la página para
                intentarlo de nuevo.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <CampaniaFormDialog
                  clientes={[
                    { id: cliente.id, nombre_negocio: cliente.nombre_negocio },
                  ]}
                />
              </div>
              <PanelCampanias campanias={listaCampanias} conFiltro={false} />
            </>
          )}
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
