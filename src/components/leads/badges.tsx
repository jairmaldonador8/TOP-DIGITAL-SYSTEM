import { cn } from '@/lib/utils'

export type EtapaLead =
  | 'nuevo'
  | 'contactado'
  | 'interesado'
  | 'cotizado'
  | 'ganado'
  | 'perdido'

const ESTILOS_ETAPA: Record<EtapaLead, string> = {
  nuevo: 'bg-marca-violeta/20 text-marca-violeta',
  contactado: 'bg-amber-500/15 text-amber-400',
  interesado: 'bg-marca-magenta/15 text-marca-magenta',
  cotizado: 'bg-marca-naranja/15 text-marca-naranja',
  ganado: 'bg-marca text-white',
  perdido: 'bg-muted text-muted-foreground',
}

const ETIQUETAS_ETAPA: Record<EtapaLead, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  interesado: 'Interesado',
  cotizado: 'Cotizado',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

export function EtapaBadge({
  etapa,
  className,
}: {
  etapa: EtapaLead
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center rounded-4xl px-2 text-xs font-medium whitespace-nowrap',
        ESTILOS_ETAPA[etapa],
        className
      )}
    >
      {ETIQUETAS_ETAPA[etapa]}
    </span>
  )
}

export const ETIQUETAS_FUENTE: Record<string, string> = {
  meta_ads: 'Meta Ads',
  whatsapp: 'WhatsApp',
  referido: 'Referido',
  organico: 'Orgánico',
}

export const ETIQUETAS_INTERES: Record<string, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
}
