import type { Metadata } from 'next'
import Link from 'next/link'
import { ListChecksIcon, MegaphoneIcon, SparklesIcon } from 'lucide-react'

import { Atencion, type PuntoAtencion } from '@/components/paneles/atencion'
import { CifraAnimada } from '@/components/paneles/cifra-animada'
import { Dona } from '@/components/paneles/dona'
import { Embudo } from '@/components/paneles/embudo'
import { StatCard } from '@/components/paneles/stat-card'
import { EtapaBadge, type EtapaLead } from '@/components/leads/badges'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import {
  formatoFechaCorta,
  formatoFechaHora,
  formatoFechaLarga,
  formatoMoneda,
  hoyEnMexico,
  inicioDeMes,
  inicioDeMesAnterior,
} from '@/lib/formato'
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

type LeadReciente = {
  id: string
  nombre: string | null
  etapa: EtapaLead
  created_at: string
  clientes: { nombre_negocio: string } | null
}

const mesEnCurso = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  month: 'long',
})

/** "+38% vs mes pasado" — o "primer mes" cuando no hay base de comparación. */
function tendenciaVs(actual: number, anterior: number) {
  if (anterior <= 0) {
    return { delta: actual > 0 ? 1 : 0, texto: 'primer mes con datos' }
  }
  const delta = Math.round(((actual - anterior) / anterior) * 100)
  return { delta, texto: `${delta >= 0 ? '+' : ''}${delta}% vs mes pasado` }
}

export default async function PaginaAgencia() {
  const actual = await usuarioActual()
  const nombre = actual.nombre ?? 'Equipo Top Digital'
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  const supabase = await createClient()

  const desde = inicioDeMes()
  const desdeAnterior = inicioDeMesAnterior()
  const ahora = new Date()
  const hoy = hoyEnMexico()
  const hace14dias = new Date(ahora.getTime() - 13 * 86400000)
  hace14dias.setHours(0, 0, 0, 0)
  const hace48h = new Date(ahora.getTime() - 48 * 3600000).toISOString()

  const [
    leadsMes,
    leadsAnterior,
    ganadosMes,
    ganadosAnterior,
    campanias,
    tareas,
    tareasVencidas,
    actividades,
    leadsRecientes,
    mensajesSinResponder,
    leadsSinAtender,
    leads14dias,
    metasClientes,
  ] = await Promise.all([
    supabase.from('leads').select('id, etapa').gte('created_at', desde),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', desdeAnterior)
      .lt('created_at', desde),
    supabase
      .from('leads')
      .select('monto_venta')
      .eq('etapa', 'ganado')
      .gte('fecha_cierre', desde),
    supabase
      .from('leads')
      .select('monto_venta')
      .eq('etapa', 'ganado')
      .gte('fecha_cierre', desdeAnterior)
      .lt('fecha_cierre', desde),
    supabase
      .from('campanias')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activa'),
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .neq('estado', 'completada'),
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .neq('estado', 'completada')
      .lt('fecha_limite', hoy),
    supabase
      .from('actividades')
      .select('id, texto, created_at, clientes ( nombre_negocio )')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('leads')
      .select('id, nombre, etapa, created_at, clientes ( nombre_negocio )')
      .order('created_at', { ascending: false })
      .limit(5),
    miId
      ? supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('leido', false)
          .or(`autor_id.neq.${miId},autor_id.is.null`)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('etapa', 'nuevo')
      .lt('created_at', hace48h),
    supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', hace14dias.toISOString()),
    supabase
      .from('clientes')
      .select('meta_facturacion')
      .eq('es_agencia', false)
      .eq('estado', 'activo'),
  ])

  // ===== Métricas y tendencias =====
  const filasLeadsMes = (leadsMes.data ?? []) as { etapa: string }[]
  const totalLeadsMes = filasLeadsMes.length
  const sumaVentas = (filas: { monto_venta: number | null }[] | null) =>
    (filas ?? []).reduce((suma, lead) => suma + (lead.monto_venta ?? 0), 0)
  const ventasMes = sumaVentas(ganadosMes.data)
  const ventasAnterior = sumaVentas(ganadosAnterior.data)
  const ganadosDelMes = (ganadosMes.data ?? []).length
  const conversionMes =
    totalLeadsMes > 0 ? Math.round((ganadosDelMes / totalLeadsMes) * 100) : 0

  // Meta global: la suma de las metas de facturación de los clientes activos.
  const metaGlobal = (
    (metasClientes.data ?? []) as { meta_facturacion: number }[]
  ).reduce((suma, fila) => suma + Number(fila.meta_facturacion ?? 0), 0)
  const pctMetaGlobal = metaGlobal > 0 ? (ventasMes / metaGlobal) * 100 : 0
  const mesNombre = mesEnCurso.format(new Date())

  // ===== Sparkline: leads por día, últimos 14 días =====
  const porDia = new Array<number>(14).fill(0)
  for (const fila of (leads14dias.data ?? []) as { created_at: string }[]) {
    const indice = Math.floor(
      (new Date(fila.created_at).getTime() - hace14dias.getTime()) / 86400000
    )
    if (indice >= 0 && indice < 14) porDia[indice] += 1
  }

  // ===== Embudo del mes =====
  const conteosEmbudo: Record<string, number> = {}
  for (const fila of filasLeadsMes) {
    conteosEmbudo[fila.etapa] = (conteosEmbudo[fila.etapa] ?? 0) + 1
  }

  // ===== Requiere tu atención =====
  const puntos: PuntoAtencion[] = []
  const mensajes = mensajesSinResponder.count ?? 0
  if (mensajes > 0) {
    puntos.push({
      id: 'chats',
      icono: 'chat',
      cantidad: mensajes,
      titulo:
        mensajes === 1
          ? '1 mensaje sin responder'
          : `${mensajes} mensajes sin responder`,
      detalle: 'Tus clientes esperan respuesta',
      href: '/agencia/chats',
    })
  }
  const vencidas = tareasVencidas.count ?? 0
  if (vencidas > 0) {
    puntos.push({
      id: 'tareas',
      icono: 'tarea',
      cantidad: vencidas,
      titulo: vencidas === 1 ? '1 tarea vencida' : `${vencidas} tareas vencidas`,
      detalle: 'Se pasó su fecha límite',
      href: '/agencia/tareas',
    })
  }
  const sinAtender = leadsSinAtender.count ?? 0
  if (sinAtender > 0) {
    puntos.push({
      id: 'leads',
      icono: 'lead',
      cantidad: sinAtender,
      titulo:
        sinAtender === 1
          ? '1 lead sin atender'
          : `${sinAtender} leads sin atender`,
      detalle: 'Nuevos con 2+ días de espera',
      href: '/agencia/leads',
    })
  }

  const listaActividades = (actividades.data ?? []) as unknown as Actividad[]
  const listaLeads = (leadsRecientes.data ?? []) as unknown as LeadReciente[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hola, {nombre} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {puntos.length > 0
              ? 'Esto es lo que necesita tu atención hoy.'
              : 'Todo al día — así va la agencia.'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
      </header>

      <Atencion puntos={puntos} />

      <section
        data-tour="metricas"
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both flex flex-col gap-3 delay-100 duration-500"
      >
        {/* Tarjeta principal con aura de degradado (estilo balance) */}
        <Card className="relative gap-5 overflow-hidden border-border/60 px-6 py-6 sm:px-8 sm:py-7">
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

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Ventas cerradas de {mesNombre}
              </p>
              <span className="rounded-full bg-marca-magenta/15 px-2.5 py-0.5 text-xs font-semibold text-marca-magenta">
                {tendenciaVs(ventasMes, ventasAnterior).texto}
              </span>
            </div>
            <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              <CifraAnimada valor={ventasMes} formato="moneda" />
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              entre todos tus clientes
            </p>
          </div>
        </Card>

        {/*
          Bento: en móvil los cuadritos chicos van lado a lado y las donas
          debajo en par; en desktop los cuadritos se apilan en una columna
          angosta jugando contra las donas y el sparkline.
        */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 grid grid-cols-2 gap-3 lg:col-span-1 lg:grid-cols-1">
            <Link
              href="/agencia/campanias"
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Card className="h-full justify-between gap-3 px-4 py-4">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-xl bg-marca-violeta/20"
                >
                  <MegaphoneIcon className="size-4.5 text-marca-violeta" />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    <CifraAnimada valor={campanias.count ?? 0} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Campañas activas
                  </p>
                </div>
              </Card>
            </Link>
            <Link
              href="/agencia/tareas"
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Card className="h-full justify-between gap-3 px-4 py-4">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-xl bg-marca-naranja/15"
                >
                  <ListChecksIcon className="size-4.5 text-marca-naranja" />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    <CifraAnimada valor={tareas.count ?? 0} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tareas pendientes
                    {vencidas > 0 ? (
                      <span className="text-destructive">
                        {' '}
                        · {vencidas} {vencidas === 1 ? 'vencida' : 'vencidas'}
                      </span>
                    ) : null}
                  </p>
                </div>
              </Card>
            </Link>
          </div>

          <Card className="items-center justify-between gap-2 px-4 py-5 text-center">
            <p className="text-sm font-semibold">Meta global</p>
            {metaGlobal > 0 ? (
              <>
                <Dona pct={pctMetaGlobal} id="meta-agencia" />
                <p className="text-xs text-muted-foreground">
                  {formatoMoneda(ventasMes)} de {formatoMoneda(metaGlobal)}
                </p>
              </>
            ) : (
              <p className="py-10 text-sm text-muted-foreground">
                Configura metas en tus clientes
              </p>
            )}
          </Card>
          <Card className="items-center justify-between gap-2 px-4 py-5 text-center">
            <p className="text-sm font-semibold">Conversión</p>
            <Dona pct={conversionMes} id="conversion-agencia" />
            <p className="text-xs text-muted-foreground">
              {ganadosDelMes} {ganadosDelMes === 1 ? 'venta' : 'ventas'} de{' '}
              {totalLeadsMes} {totalLeadsMes === 1 ? 'lead' : 'leads'}
            </p>
          </Card>
          <div className="col-span-2 lg:col-span-1">
            <StatCard
              titulo="Leads del mes"
              cifra={{ valor: totalLeadsMes }}
              tendencia={tendenciaVs(totalLeadsMes, leadsAnterior.count ?? 0)}
              sparkline={porDia}
              href="/agencia/leads"
            />
          </div>
        </div>
      </section>

      <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both grid gap-6 delay-200 duration-500 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Embudo del mes</CardTitle>
          </CardHeader>
          <CardContent>
            {totalLeadsMes === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay leads este mes. En cuanto lleguen, aquí verás su
                recorrido hasta la venta.
              </p>
            ) : (
              <Embudo
                conteos={conteosEmbudo}
                perdidos={conteosEmbudo.perdido ?? 0}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Últimos leads</CardTitle>
          </CardHeader>
          <CardContent>
            {listaLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin leads todavía.
              </p>
            ) : (
              <ul className="flex flex-col">
                {listaLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href="/agencia/leads"
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {lead.nombre ?? 'Sin nombre'}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lead.clientes?.nombre_negocio ?? '—'} ·{' '}
                          {formatoFechaCorta(lead.created_at)}
                        </span>
                      </span>
                      <EtapaBadge etapa={lead.etapa} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both delay-300 duration-500">
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
                  className="flex items-center gap-3 border-b border-border py-3 text-sm last:border-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary"
                  >
                    <SparklesIcon className="size-4 text-marca-magenta" />
                  </span>
                  <div className="min-w-0 flex-1">
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
