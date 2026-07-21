import { cn } from '@/lib/utils'

const ETAPAS_EMBUDO = [
  { clave: 'nuevo', label: 'Nuevo' },
  { clave: 'contactado', label: 'Contactado' },
  { clave: 'interesado', label: 'Interesado' },
  { clave: 'cotizado', label: 'Cotizado' },
  { clave: 'ganado', label: 'Ganado' },
] as const

/**
 * Embudo del mes: una barra por etapa (ancho relativo al máximo) que crece
 * en cascada al entrar. `perdidos` se muestra aparte como nota al pie.
 */
export function Embudo({
  conteos,
  perdidos,
}: {
  conteos: Record<string, number>
  perdidos: number
}) {
  const maximo = Math.max(...ETAPAS_EMBUDO.map((e) => conteos[e.clave] ?? 0), 1)

  return (
    <div className="flex flex-col gap-3.5">
      {ETAPAS_EMBUDO.map((etapa, i) => {
        const cantidad = conteos[etapa.clave] ?? 0
        return (
          <div key={etapa.clave} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] text-muted-foreground">
              {etapa.label}
            </span>
            <div className="h-6 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary/60">
              <div
                className={cn(
                  'animar-crecer-x h-full rounded-full',
                  etapa.clave === 'ganado' ? 'bg-marca' : 'bg-marca opacity-45'
                )}
                style={{
                  width: `${Math.max(cantidad > 0 ? 8 : 0, (cantidad / maximo) * 100)}%`,
                  animationDelay: `${150 + i * 110}ms`,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
              {cantidad}
            </span>
          </div>
        )
      })}
      {perdidos > 0 ? (
        <p className="text-xs text-muted-foreground">
          {perdidos === 1
            ? '1 lead perdido este mes'
            : `${perdidos} leads perdidos este mes`}
        </p>
      ) : null}
    </div>
  )
}
