import type { Metadata } from 'next'
import { SendIcon } from 'lucide-react'

import { ETIQUETAS_FUENTE } from '@/components/leads/badges'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatoFechaCorta, formatoMoneda } from '@/lib/formato'
import {
  textoWhatsApp,
  type DatosReporte,
  type RangoSemana,
} from '@/lib/reportes/semanal'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Reportes',
}

type FilaLead = {
  fuente: string
  etapa: string
  monto_venta: number | null
  clientes: { nombre_negocio: string } | null
}

const ETAPAS_EMBUDO = [
  'nuevo',
  'contactado',
  'interesado',
  'cotizado',
  'ganado',
] as const

const ETIQUETAS_ETAPA: Record<string, string> = {
  nuevo: 'Nuevos',
  contactado: 'Contactados',
  interesado: 'Interesados',
  cotizado: 'Cotizados',
  ganado: 'Ganados',
}

/** Fila de barra horizontal con el degradado de marca. */
function Barra({
  etiqueta,
  valor,
  maximo,
  detalle,
}: {
  etiqueta: string
  valor: number
  maximo: number
  detalle?: string
}) {
  const ancho = maximo > 0 ? Math.max((valor / maximo) * 100, 2) : 2
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-muted-foreground">
        {etiqueta}
      </span>
      <span className="h-2.5 flex-1 rounded-full bg-secondary">
        <span
          className="bg-marca block h-full rounded-full"
          style={{ width: `${ancho}%` }}
        />
      </span>
      <span className="w-20 shrink-0 text-right font-semibold">
        {detalle ?? valor}
      </span>
    </li>
  )
}

/** Resumen del cron semanal (lunes 8:00) con reenvío manual por WhatsApp. */
function ResumenSemanal({
  semanaInicio,
  datos,
}: {
  semanaInicio: string
  datos: DatosReporte
}) {
  // fin = inicio + 6 días (domingo), solo para mostrar.
  const fin = new Date(`${semanaInicio}T12:00:00Z`)
  fin.setUTCDate(fin.getUTCDate() + 6)
  const rango: RangoSemana = {
    inicio: semanaInicio,
    fin: fin.toISOString().slice(0, 10),
    desdeUtc: '',
    hastaUtc: '',
  }

  const stats = [
    { etiqueta: 'Leads nuevos', valor: String(datos.leadsNuevos) },
    {
      etiqueta: 'Ventas cerradas',
      valor: `${datos.cierres} · ${formatoMoneda(datos.montoCerrado)}`,
    },
    { etiqueta: 'Seguimientos', valor: String(datos.seguimientos) },
    {
      etiqueta: 'Encargos',
      valor:
        `${datos.encargosEntregados} entregados · ${datos.encargosAprobados} aprobados` +
        (datos.encargosAtrasados > 0
          ? ` · ${datos.encargosAtrasados} atrasados`
          : ''),
    },
  ]

  return (
    <Card className="border-marca-violeta/30">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>
          Resumen semanal · {formatoFechaCorta(rango.inicio)} al{' '}
          {formatoFechaCorta(rango.fin)}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          render={
            <a
              href={`https://wa.me/?text=${encodeURIComponent(textoWhatsApp(datos, rango))}`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <SendIcon data-icon="inline-start" aria-hidden />
          Compartir por WhatsApp
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.etiqueta}>
            <p className="text-sm font-semibold">{stat.valor}</p>
            <p className="text-xs text-muted-foreground">{stat.etiqueta}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default async function PaginaReportes() {
  const supabase = await createClient()

  const [{ data, error }, reporteRes] = await Promise.all([
    supabase
      .from('leads')
      .select('fuente, etapa, monto_venta, clientes ( nombre_negocio )'),
    supabase
      .from('reportes_semanales')
      .select('semana_inicio, datos')
      .order('semana_inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (error) console.error('Error al cargar reportes:', error)
  const leads = (data ?? []) as unknown as FilaLead[]
  const reporte = reporteRes.data as {
    semana_inicio: string
    datos: DatosReporte
  } | null

  const porFuente = new Map<string, number>()
  const porEtapa = new Map<string, number>()
  const ventasPorCliente = new Map<string, number>()
  for (const lead of leads) {
    porFuente.set(lead.fuente, (porFuente.get(lead.fuente) ?? 0) + 1)
    porEtapa.set(lead.etapa, (porEtapa.get(lead.etapa) ?? 0) + 1)
    if (lead.etapa === 'ganado' && lead.monto_venta != null) {
      const negocio = lead.clientes?.nombre_negocio ?? 'Sin cliente'
      ventasPorCliente.set(
        negocio,
        (ventasPorCliente.get(negocio) ?? 0) + lead.monto_venta
      )
    }
  }

  const maxFuente = Math.max(...porFuente.values(), 0)
  const maxEtapa = Math.max(...porEtapa.values(), 0)
  const ventas = [...ventasPorCliente.entries()].sort((a, b) => b[1] - a[1])
  const maxVenta = ventas[0]?.[1] ?? 0

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen histórico de leads y ventas de todos los clientes.
        </p>
      </header>

      {reporte ? (
        <ResumenSemanal
          semanaInicio={reporte.semana_inicio}
          datos={reporte.datos}
        />
      ) : null}

      {error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar los reportes. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Embudo de leads</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {ETAPAS_EMBUDO.map((etapa) => (
                  <Barra
                    key={etapa}
                    etiqueta={ETIQUETAS_ETAPA[etapa]}
                    valor={porEtapa.get(etapa) ?? 0}
                    maximo={maxEtapa}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leads por fuente</CardTitle>
            </CardHeader>
            <CardContent>
              {porFuente.size === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aún no hay leads registrados.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {[...porFuente.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([fuente, cantidad]) => (
                      <Barra
                        key={fuente}
                        etiqueta={ETIQUETAS_FUENTE[fuente] ?? fuente}
                        valor={cantidad}
                        maximo={maxFuente}
                      />
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ventas por cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {ventas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todavía no hay ventas cerradas.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {ventas.map(([negocio, total]) => (
                    <Barra
                      key={negocio}
                      etiqueta={negocio}
                      valor={total}
                      maximo={maxVenta}
                      detalle={formatoMoneda(total)}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
