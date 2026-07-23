import type { NextRequest } from 'next/server'

import { cargarElementos } from '@/lib/calendario/fuentes'
import { generarICS } from '@/lib/calendario/ics'
import { hoyEnMexico } from '@/lib/formato'
import { createAdminClient } from '@/lib/supabase/admin'

/** fecha ± dias en YYYY-MM-DD (anclado a mediodía UTC, patrón #418). */
function sumarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T12:00:00Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/**
 * Feed iCal de suscripción (Google Calendar → "Agregar por URL"). Google
 * no trae sesión: token secreto + cliente admin, igual que el cron.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const secreto = process.env.ICS_SECRET
  // Fail-closed: sin secreto configurado nadie entra.
  if (!secreto || token !== secreto) {
    return new Response('No autorizado', { status: 401 })
  }

  const hoy = hoyEnMexico()
  const elementos = await cargarElementos(
    createAdminClient(),
    sumarDias(hoy, -60),
    sumarDias(hoy, 365)
  )

  return new Response(generarICS(elementos), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
    },
  })
}
