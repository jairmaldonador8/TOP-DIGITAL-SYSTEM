/**
 * Funciones puras que traducen respuestas de la Graph API al dominio.
 * Ver .claude/skills/meta-marketing-api/SKILL.md para el porque de cada regla.
 */
import type { EstadoCampania } from '@/lib/campanias/tipos'

import type { AccionInsight } from './tipos'

/** Columna "Resultados" de Ads Manager para campanas de clic a WhatsApp. */
const ACCION_CONVERSACIONES =
  'onsite_conversion.messaging_conversation_started_7d'

export function estadoDesdeMeta(effectiveStatus: string): EstadoCampania {
  if (effectiveStatus === 'ACTIVE') return 'activa'
  if (effectiveStatus === 'ARCHIVED' || effectiveStatus === 'DELETED') {
    return 'archivada'
  }
  // PAUSED e intermedios de nivel campania (IN_PROCESS, WITH_ISSUES):
  // no estan corriendo. El default tambien absorbe, por defensa, estados
  // de nivel anuncio/ad set (CAMPAIGN_PAUSED, PENDING_REVIEW...) que la
  // API no devuelve a nivel campania — sync.ts filtra solo los primeros.
  return 'pausada'
}

export function conversacionesDe(
  actions: AccionInsight[] | undefined,
): number {
  const accion = actions?.find((a) => a.action_type === ACCION_CONVERSACIONES)
  const valor = Number(accion?.value)
  return Number.isFinite(valor) ? valor : 0
}

export function gastoDe(spend: string | undefined): number {
  const valor = Number(spend)
  return Number.isFinite(valor) ? valor : 0
}
