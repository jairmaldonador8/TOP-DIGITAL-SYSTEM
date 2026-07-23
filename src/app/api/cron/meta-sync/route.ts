/**
 * Cron diario del sync de Meta. Vercel lo dispara con
 * `Authorization: Bearer <CRON_SECRET>`; sin ese secreto configurado o con
 * uno equivocado, nadie entra (fail-closed).
 */
import type { NextRequest } from 'next/server'

import { sincronizarMeta } from '@/lib/meta/sync'

// Cubre el presupuesto de tiempo del orquestador (PRESUPUESTO_MS) mas
// margen; el limite duro de Vercel para crons esta en 300s.
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const header = request.headers.get('authorization')
  const secreto = process.env.CRON_SECRET
  // Fail-closed: sin secreto configurado nadie entra.
  if (!secreto || header !== `Bearer ${secreto}`) {
    return new Response('No autorizado', { status: 401 })
  }

  const resumen = await sincronizarMeta('cron')
  return Response.json(resumen)
}
