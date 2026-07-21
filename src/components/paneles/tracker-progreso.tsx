import { CifraAnimada } from '@/components/paneles/cifra-animada'
import { Dona } from '@/components/paneles/dona'
import { Card } from '@/components/ui/card'
import { formatoMoneda } from '@/lib/formato'
import { cn } from '@/lib/utils'

export type LeadProgreso = {
  created_at: string
  etapa: string
  monto_venta: number | null
  fecha_cierre: string | null
}

const ZONA = 'America/Mexico_City'

const claveMes = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
})

const etiquetaMes = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA,
  month: 'short',
})

const mesLargo = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA,
  month: 'long',
  year: 'numeric',
})

type Mes = {
  clave: string // 'YYYY-MM'
  etiqueta: string // 'jul'
  leads: number
  ventas: number
}

/**
 * Serie mensual desde el mes de inicio hasta hoy (máximo los últimos 12).
 * El día 15 a mediodía UTC evita corrimientos de zona horaria al etiquetar.
 */
function construirMeses(desde: string, leads: LeadProgreso[]): Mes[] {
  const inicio = claveMes.format(new Date(desde)) // 'YYYY-MM'
  const [añoInicio, mesInicio] = inicio.split('-').map(Number)

  const meses: Mes[] = []
  for (let i = 0; i < 120; i++) {
    const fecha = new Date(Date.UTC(añoInicio, mesInicio - 1 + i, 15, 12))
    const clave = claveMes.format(fecha)
    meses.push({ clave, etiqueta: etiquetaMes.format(fecha), leads: 0, ventas: 0 })
    if (clave === claveMes.format(new Date())) break
  }

  const porClave = new Map(meses.map((mes) => [mes.clave, mes]))
  for (const lead of leads) {
    const mesLead = porClave.get(claveMes.format(new Date(lead.created_at)))
    if (mesLead) mesLead.leads += 1
    if (lead.etapa === 'ganado' && lead.monto_venta != null) {
      const mesVenta = porClave.get(
        claveMes.format(new Date(lead.fecha_cierre ?? lead.created_at))
      )
      if (mesVenta) mesVenta.ventas += lead.monto_venta
    }
  }
  return meses.slice(-12)
}

/**
 * Tracker de progreso estilo bento: acumulados en display grande, gauge de
 * meta sobre la tarjeta de marca y barras mensuales anchas con el mes en
 * curso destacado. Se usa en el portal del cliente y en el detalle del
 * cliente en la agencia. Con `resumido` omite el gauge y la conversión
 * (cuando el dashboard ya los muestra como donas aparte).
 */
export function TrackerProgreso({
  titulo,
  desde,
  meta,
  leads,
  resumido = false,
}: {
  titulo: string
  desde: string
  meta: number
  leads: LeadProgreso[]
  resumido?: boolean
}) {
  const meses = construirMeses(desde, leads)
  const mesActual = meses[meses.length - 1]
  const mesAnterior = meses.length > 1 ? meses[meses.length - 2] : null

  const totalLeads = leads.length
  const ganados = leads.filter((lead) => lead.etapa === 'ganado')
  const totalVentas = ganados.reduce(
    (suma, lead) => suma + (lead.monto_venta ?? 0),
    0
  )
  const conversion =
    totalLeads > 0 ? Math.round((ganados.length / totalLeads) * 100) : 0

  const maxVentas = Math.max(...meses.map((mes) => mes.ventas), 1)
  const pctMeta = meta > 0 ? (mesActual.ventas / meta) * 100 : 0

  const tendencia =
    mesAnterior && mesAnterior.ventas > 0
      ? Math.round(
          ((mesActual.ventas - mesAnterior.ventas) / mesAnterior.ventas) * 100
        )
      : null

  const inicioTexto = mesLargo.format(new Date(desde))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
        <p className="text-sm text-muted-foreground">
          Desde {inicioTexto} ·{' '}
          {meses.length === 1 ? 'primer mes' : `${meses.length} meses`} juntos
        </p>
      </div>

      {/* Acumulados en display grande */}
      <div
        className={cn(
          'grid gap-3',
          resumido ? 'grid-cols-2' : 'sm:grid-cols-3'
        )}
      >
        <Card className="gap-1 px-6 py-5">
          <p className="text-xs text-muted-foreground">Leads en total</p>
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            <CifraAnimada valor={totalLeads} />
          </p>
        </Card>
        <Card className="gap-1 px-6 py-5">
          <p className="text-xs text-muted-foreground">Ventas en total</p>
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            <CifraAnimada valor={totalVentas} formato="moneda" />
          </p>
        </Card>
        {resumido ? null : (
        <Card className="gap-1 px-6 py-5">
          <p className="text-xs text-muted-foreground">Conversión</p>
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            <CifraAnimada valor={conversion} sufijo="%" />
          </p>
          {/* Barra gruesa con la textura rayada de la inspiración */}
          <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-marca animar-crecer-x relative h-full rounded-full"
              style={{
                width: `${Math.max(conversion, 2)}%`,
                animationDelay: '200ms',
              }}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0 6px, transparent 6px 14px)',
                }}
              />
            </div>
          </div>
        </Card>
        )}
      </div>

      <div
        className={cn(
          'grid gap-3',
          !resumido && 'lg:grid-cols-[1.1fr_2fr]'
        )}
      >
        {resumido ? null : (
        <Card className="bg-marca items-center gap-2 border-0 px-6 py-6 text-white">
          <p className="self-start text-sm font-semibold">
            {meta > 0 ? 'Meta de este mes' : 'Conversión global'}
          </p>
          <Dona
            pct={meta > 0 ? pctMeta : conversion}
            id="gauge-tracker"
            tono="blanco"
          />
          {meta > 0 ? (
            <div className="text-center">
              <p className="text-sm font-medium">
                {formatoMoneda(mesActual.ventas)}{' '}
                <span className="text-white/75">
                  de {formatoMoneda(meta)}
                </span>
              </p>
              {pctMeta >= 100 ? (
                <p className="mt-1 text-sm font-semibold">
                  ¡Meta del mes alcanzada! 🎉
                </p>
              ) : (
                <p className="mt-1 text-xs text-white/75">
                  cada venta cerrada suma aquí
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-white/85">
              {ganados.length} de {totalLeads}{' '}
              {totalLeads === 1 ? 'lead' : 'leads'} se volvieron ventas
            </p>
          )}
        </Card>
        )}

        {/* Barras mensuales anchas, mes actual destacado */}
        <Card className="gap-4 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Ventas mes a mes</p>
            {tendencia !== null ? (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  tendencia >= 0
                    ? 'bg-marca-magenta/15 text-marca-magenta'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tendencia >= 0 ? '+' : ''}
                {tendencia}% vs mes pasado
              </span>
            ) : null}
          </div>

          {totalLeads === 0 ? (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
              Aquí verás el crecimiento mes a mes en cuanto lleguen los
              primeros leads.
            </p>
          ) : (
            <div className="flex flex-1 flex-col justify-end">
              <div className="flex h-36 items-end gap-2 sm:gap-3">
                {meses.map((mes, i) => {
                  const esActual = i === meses.length - 1
                  const esPrevio = i === meses.length - 2
                  return (
                    <div
                      key={mes.clave}
                      title={`${mes.etiqueta}: ${formatoMoneda(mes.ventas)} · ${mes.leads} ${mes.leads === 1 ? 'lead' : 'leads'}`}
                      className="flex h-full min-w-0 flex-1 items-end"
                    >
                      <div
                        className={cn(
                          'animar-crecer-y mx-auto w-full max-w-20 rounded-xl',
                          esActual
                            ? 'bg-marca'
                            : esPrevio
                              ? 'bg-foreground/85'
                              : 'bg-muted-foreground/25'
                        )}
                        style={{
                          height: `${Math.max((mes.ventas / maxVentas) * 100, 8)}%`,
                          animationDelay: `${150 + i * 80}ms`,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex gap-2 sm:gap-3">
                {meses.map((mes) => (
                  <div key={mes.clave} className="min-w-0 flex-1 text-center">
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {mes.etiqueta}
                    </p>
                    <p className="hidden truncate text-[10px] text-muted-foreground/60 sm:block">
                      {mes.leads} {mes.leads === 1 ? 'lead' : 'leads'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
