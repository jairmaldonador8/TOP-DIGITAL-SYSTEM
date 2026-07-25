/**
 * Envío de correos vía Resend (API HTTP directa, sin SDK). Mismo contrato
 * que el push: best-effort, NO bloqueante (after()) y no-op silencioso si
 * falta RESEND_API_KEY — la app funciona igual sin correo configurado.
 */
import 'server-only'

import { after } from 'next/server'

const REMITENTE = 'Top Digital <equipo@topdigital.company>'

async function enviarAhora(
  para: string,
  asunto: string,
  html: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: REMITENTE, to: [para], subject: asunto, html }),
      signal: AbortSignal.timeout(8000),
    })
    if (!respuesta.ok) {
      console.error(
        'Error al enviar correo:',
        respuesta.status,
        await respuesta.text()
      )
    }
  } catch (e) {
    console.error('Error al enviar correo:', e)
  }
}

/** Encola el envío para después de responder; nunca lanza ni retrasa. */
export async function enviarEmail(
  para: string,
  asunto: string,
  html: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    after(() => enviarAhora(para, asunto, html))
  } catch {
    await enviarAhora(para, asunto, html)
  }
}
