/**
 * Cliente minimo de la Graph API v25 (solo lectura). Sin SDK: fetch nativo.
 * Server-only: usa META_SYSTEM_TOKEN / META_APP_SECRET.
 */
import 'server-only'

import { createHmac } from 'node:crypto'

import type { PaginaGraph } from './tipos'

const BASE = 'https://graph.facebook.com/v25.0'
const CODIGOS_THROTTLE = new Set([80000, 80004])
const CODIGOS_LEGACY = new Set([4, 17])
// Tope de espera acumulada POR LLAMADA a obtenerTodos (no por corrida del
// sync completo): el cron tiene maxDuration=300s y puede llamar a este
// cliente varias veces (campanas + insights, por cuenta). Presupuestar el
// tiempo total de la corrida contra ese limite es responsabilidad del
// orquestador (sync.ts, Task 4), no de este cliente.
const ESPERA_MAXIMA_MS = 120_000

export class ErrorMeta extends Error {
  constructor(
    public codigo: number,
    mensaje: string
  ) {
    super(`Meta API (${codigo}): ${mensaje}`)
  }
}

type Dormir = (ms: number) => Promise<void>
const dormirReal: Dormir = (ms) => new Promise((r) => setTimeout(r, ms))

export async function obtenerTodos<T>(
  ruta: string,
  params: Record<string, string> = {},
  dormir: Dormir = dormirReal
): Promise<T[]> {
  const token = process.env.META_SYSTEM_TOKEN
  const secret = process.env.META_APP_SECRET
  if (!token || !secret) {
    throw new Error('Faltan META_SYSTEM_TOKEN / META_APP_SECRET')
  }

  const url = new URL(`${BASE}${ruta}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('access_token', token)
  url.searchParams.set(
    'appsecret_proof',
    createHmac('sha256', secret).update(token).digest('hex')
  )

  const filas: T[] = []
  let siguiente: string | null = url.toString()
  let reintentos = 0
  let esperaAcumuladaMs = 0

  while (siguiente) {
    let cuerpo: PaginaGraph<T> & {
      error?: {
        code: number
        message: string
        estimated_time_to_regain_access?: number
      }
    }
    try {
      // siguiente incluye access_token y appsecret_proof en el query
      // string: nunca loguear esta URL.
      const respuesta = await fetch(siguiente)
      cuerpo = await respuesta.json()
    } catch (error) {
      // Solo se reintentan errores reportados por Meta (con codigo); un
      // fallo de red o una respuesta no-JSON (HTML de un proxy/CDN, etc.)
      // no trae codigo con el que decidir throttle vs backoff, asi que se
      // propaga de inmediato sin reintento.
      throw new Error(
        `Fallo de red o respuesta invalida de Meta: ${(error as Error).message}`
      )
    }

    if (cuerpo.error) {
      const { code, message } = cuerpo.error
      const esperable =
        CODIGOS_THROTTLE.has(code) || CODIGOS_LEGACY.has(code)
      if (esperable && reintentos < 2) {
        reintentos += 1
        const minutos = cuerpo.error.estimated_time_to_regain_access ?? 0
        const ms = CODIGOS_THROTTLE.has(code)
          ? Math.max(minutos, 1) * 60_000
          : 1000 * 2 ** (reintentos - 1)

        // Si dormir esto nos pasa del tope global, no dormimos: mejor
        // fallar ya y dejar que el sync registre el error y siga con
        // las demas cuentas, a que Vercel mate la funcion a medio dormir.
        if (esperaAcumuladaMs + ms > ESPERA_MAXIMA_MS) {
          throw new ErrorMeta(code, message)
        }

        esperaAcumuladaMs += ms
        await dormir(ms)
        continue // reintenta la misma URL
      }
      throw new ErrorMeta(code, message)
    }

    reintentos = 0
    filas.push(...(cuerpo.data ?? []))
    // Unica senal fiable de fin: que no venga paging.next (una pagina
    // puede traer data vacia y aun tener next).
    siguiente = cuerpo.paging?.next ?? null
  }

  return filas
}
