import type { Metadata } from 'next'
import { SparklesIcon } from 'lucide-react'

import { CifraAnimada } from '@/components/paneles/cifra-animada'
import { Dona } from '@/components/paneles/dona'
import {
  TrackerProgreso,
  type LeadProgreso,
} from '@/components/paneles/tracker-progreso'
import { AccionesRapidas } from '@/components/portal/acciones-rapidas'
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
  title: 'Mi Panel',
}

type Actividad = { id: string; texto: string; created_at: string }

const mesEnCurso = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  month: 'long',
})

function inicialesNegocio(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function PaginaPortal() {
  const actual = await usuarioActual()
  const supabase = await createClient()
  const desde = inicioDeMes()

  // La RLS limita todas las consultas al cliente de la sesión.
  const [cliente, leadsMes, todosLeads, campanias, actividades] =
    await Promise.all([
      supabase
        .from('clientes')
        .select('nombre_negocio, contacto_nombre, meta_facturacion, created_at')
        .eq('es_agencia', false)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', desde),
      supabase
        .from('leads')
        .select('etapa, monto_venta, fecha_cierre, created_at'),
      supabase
        .from('campanias')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activa'),
      supabase
        .from('actividades')
        .select('id, texto, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const negocio = cliente.data?.nombre_negocio ?? actual.negocio ?? 'Tu negocio'
  const contacto = cliente.data?.contacto_nombre ?? actual.nombre
  const clienteDesde = cliente.data?.created_at
    ? new Date(cliente.data.created_at).getFullYear()
    : null

  const leads = (todosLeads.data ?? []) as LeadProgreso[]
  const ganados = leads.filter((lead) => lead.etapa === 'ganado')
  const conversion =
    leads.length > 0 ? Math.round((ganados.length / leads.length) * 100) : 0
  const ventasMes = ganados
    .filter((lead) => lead.fecha_cierre !== null && lead.fecha_cierre >= desde)
    .reduce((suma, lead) => suma + (lead.monto_venta ?? 0), 0)

  const meta = Number(cliente.data?.meta_facturacion ?? 0)
  const pctMeta = meta > 0 ? (ventasMes / meta) * 100 : 0
  const mesNombre = mesEnCurso.format(new Date())

  const listaActividades = (actividades.data ?? []) as Actividad[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {actual.nombre ?? 'bienvenido'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Así van los resultados de tu negocio.
        </p>
      </header>

      {/* Tarjeta principal con aura de degradado (estilo balance) */}
      <Card
        data-tour="perfil"
        className="relative gap-6 overflow-hidden border-border/60 px-6 py-6 sm:px-8 sm:py-7"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-16 size-72 rounded-full bg-marca-violeta/45 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -bottom-32 size-80 rounded-full bg-marca-naranja/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 size-44 -translate-x-1/3 rounded-full bg-marca-magenta/30 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span
            aria-hidden
            className="bg-marca flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
          >
            {inicialesNegocio(negocio)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{negocio}</p>
            {contacto ? (
              <p className="truncate text-xs text-muted-foreground">
                {contacto}
              </p>
            ) : null}
          </div>
          {clienteDesde ? (
            <p className="shrink-0 text-xs text-muted-foreground">
              Cliente desde {clienteDesde}
            </p>
          ) : null}
        </div>

        <div className="relative">
          <p className="text-sm text-muted-foreground">
            Ventas de {mesNombre}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            <CifraAnimada valor={ventasMes} formato="moneda" />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs font-medium backdrop-blur">
              {leadsMes.count ?? 0}{' '}
              {(leadsMes.count ?? 0) === 1 ? 'lead' : 'leads'} este mes
            </span>
            <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs font-medium backdrop-blur">
              {campanias.count ?? 0}{' '}
              {(campanias.count ?? 0) === 1
                ? 'campaña activa'
                : 'campañas activas'}
            </span>
          </div>
        </div>
      </Card>

      <AccionesRapidas />

      {/* Gráficas circulares */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="items-center gap-2 px-4 py-5 text-center">
          <p className="text-sm font-semibold">Meta del mes</p>
          {meta > 0 ? (
            <>
              <Dona pct={pctMeta} id="meta-portal" />
              <p className="text-xs text-muted-foreground">
                {formatoMoneda(ventasMes)} de {formatoMoneda(meta)}
              </p>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              Sin meta configurada
            </p>
          )}
        </Card>
        <Card className="items-center gap-2 px-4 py-5 text-center">
          <p className="text-sm font-semibold">Conversión</p>
          <Dona pct={conversion} id="conversion-portal" />
          <p className="text-xs text-muted-foreground">
            {ganados.length} de {leads.length}{' '}
            {leads.length === 1 ? 'lead' : 'leads'} son ventas
          </p>
        </Card>
      </div>

      <TrackerProgreso
        titulo="Nuestro progreso juntos"
        desde={cliente.data?.created_at ?? new Date().toISOString()}
        meta={meta}
        leads={leads}
        resumido
      />

      <Card>
        <CardHeader>
          <CardTitle>Lo último de tu cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          {listaActividades.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aquí verás las novedades que la agencia registre sobre tu
              cuenta.
            </p>
          ) : (
            <ul className="flex flex-col">
              {listaActividades.map((actividad) => (
                <li
                  key={actividad.id}
                  className="flex items-center gap-3 border-b border-border py-3 text-sm last:border-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary"
                  >
                    <SparklesIcon className="size-4 text-marca-magenta" />
                  </span>
                  <p className="min-w-0 flex-1 truncate">{actividad.texto}</p>
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
