/**
 * Cron semanal del resumen para el dueño (lunes 8:00 CDMX; vercel.json).
 * Mismo patrón fail-closed que meta-sync: sin CRON_SECRET nadie entra.
 */
import type { NextRequest } from 'next/server'

import { generarReporteSemanal } from '@/lib/reportes/semanal-server'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const header = request.headers.get('authorization')
  const secreto = process.env.CRON_SECRET
  if (!secreto || header !== `Bearer ${secreto}`) {
    return new Response('No autorizado', { status: 401 })
  }

  const { rango, datos } = await generarReporteSemanal(new Date())
  return Response.json({ semana: rango.inicio, leads: datos.leadsNuevos })
}
