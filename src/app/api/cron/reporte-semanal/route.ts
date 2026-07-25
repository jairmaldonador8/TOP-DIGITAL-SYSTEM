/**
 * Cron semanal del resumen para el dueño (lunes 8:00 CDMX; vercel.json).
 * Mismo patrón fail-closed que meta-sync: sin CRON_SECRET nadie entra.
 */
import type { NextRequest } from 'next/server'

import { enviarPushA, idsAdmins } from '@/lib/push/push-server'
import { generarReporteSemanal } from '@/lib/reportes/semanal-server'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const header = request.headers.get('authorization')
  const secreto = process.env.CRON_SECRET
  if (!secreto || header !== `Bearer ${secreto}`) {
    return new Response('No autorizado', { status: 401 })
  }

  const { rango, datos } = await generarReporteSemanal(new Date())

  await enviarPushA(await idsAdmins(), {
    titulo: 'Tu resumen semanal está listo 📊',
    cuerpo: `${datos.leadsNuevos} leads, ${datos.cierres} cierres la semana pasada — tócalo para verlo`,
    url: '/agencia/reportes',
  })

  return Response.json({ semana: rango.inicio, leads: datos.leadsNuevos })
}
