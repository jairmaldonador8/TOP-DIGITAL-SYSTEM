/** Formas minimas de las respuestas de la Graph API v25 que consumimos. */

export type CuentaMeta = {
  id: string // "act_123..."
  name: string
  account_id: string // "123..."
  account_status: number
}

export type CampaniaMeta = {
  id: string
  name: string
  objective?: string
  effective_status: string
  start_time?: string
  stop_time?: string
}

export type AccionInsight = { action_type: string; value: string }

export type InsightCampania = {
  campaign_id: string
  spend?: string
  actions?: AccionInsight[]
  /** Presente con time_increment=1: la fecha del dia (YYYY-MM-DD). */
  date_start?: string
}

export type PaginaGraph<T> = {
  data: T[]
  paging?: { cursors?: { after?: string }; next?: string }
}
