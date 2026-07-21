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
  title: 'Mi Panel',
}

type Actividad = { id: string; texto: string; created_at: string }

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
        .select('nombre_negocio, contacto_nombre, created_at')
        .eq('es_agencia', false)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', desde),
      supabase.from('leads').select('etapa, monto_venta, fecha_cierre'),
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

  const leads = (todosLeads.data ?? []) as {
    etapa: string
    monto_venta: number | null
    fecha_cierre: string | null
  }[]
  const ganados = leads.filter((lead) => lead.etapa === 'ganado')
  const conversion =
    leads.length > 0 ? Math.round((ganados.length / leads.length) * 100) : 0
  const ventasMes = ganados
    .filter((lead) => lead.fecha_cierre !== null && lead.fecha_cierre >= desde)
    .reduce((suma, lead) => suma + (lead.monto_venta ?? 0), 0)

  const listaActividades = (actividades.data ?? []) as Actividad[]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {actual.nombre ?? 'bienvenido'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Así van los resultados de tu negocio.
        </p>
      </header>

      <div data-tour="perfil" className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        {/* Tarjeta de perfil: la marca del cliente al centro del portal. */}
        <Card className="bg-marca items-center gap-1 border-0 px-6 py-8 text-center text-white">
          <span
            aria-hidden
            className="mb-3 flex size-20 items-center justify-center rounded-3xl bg-background text-2xl font-extrabold"
          >
            <span className="text-marca">{inicialesNegocio(negocio)}</span>
          </span>
          <p className="text-xl font-bold tracking-tight">{negocio}</p>
          {contacto ? <p className="text-sm text-white/85">{contacto}</p> : null}
          {clienteDesde ? (
            <p className="mt-3 border-t border-white/30 pt-3 text-xs text-white/85">
              Cliente desde {clienteDesde}
            </p>
          ) : null}
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            titulo="Leads este mes"
            valor={String(leadsMes.count ?? 0)}
            href="/portal/leads"
          />
          <StatCard
            titulo="Ventas del mes"
            valor={formatoMoneda(ventasMes)}
            href="/portal/leads"
          />
          <StatCard
            titulo="Campañas activas"
            valor={String(campanias.count ?? 0)}
            href="/portal/campanias"
          />
          <StatCard
            titulo="Conversión"
            valor={`${conversion}%`}
            href="/portal/leads"
          />
        </div>
      </div>

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
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-sm last:border-0 last:pb-0"
                >
                  <p className="min-w-0 truncate">{actividad.texto}</p>
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
