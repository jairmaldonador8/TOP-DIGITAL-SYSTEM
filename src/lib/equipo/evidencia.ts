/**
 * Reglas puras de la evidencia de encargos (spec 2026-07-25): tipos
 * permitidos, límites y quién puede adjuntar según el estado. Las usan
 * las server actions (validación real) y la UI (mensajes tempranos).
 */

import type { EstadoEncargo } from '@/lib/equipo/transiciones'

export const MAX_TAMANO_EVIDENCIA = 25 * 1024 * 1024 // 25 MB (igual que el bucket)
export const MAX_ADJUNTOS_POR_ENCARGO = 10

/** mime canónico → extensión de la ruta en Storage. */
const MIME_A_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'video/mp4': 'mp4',
}

/** Windows reporta los ZIP con mimes alternos; se normalizan al canónico. */
const VARIANTES_ZIP = new Set([
  'application/x-zip-compressed',
  'application/zip-compressed',
])

export function normalizarMime(mime: string): string {
  const limpio = mime.trim().toLowerCase()
  return VARIANTES_ZIP.has(limpio) ? 'application/zip' : limpio
}

export function esMimePermitido(mime: string): boolean {
  return normalizarMime(mime) in MIME_A_EXTENSION
}

/** Extensión segura para la ruta (derivada del mime, nunca del nombre). */
export function extensionDe(mime: string): string | null {
  return MIME_A_EXTENSION[normalizarMime(mime)] ?? null
}

export function esImagen(mime: string): boolean {
  return normalizarMime(mime).startsWith('image/')
}

/**
 * ¿Puede este rol adjuntar/retirar evidencia con el encargo en este estado?
 * Equipo: solo mientras el trabajo está en sus manos. Admin: siempre,
 * excepto en `aprobado` (terminal).
 */
export function puedeAdjuntar(
  rol: 'equipo' | 'admin',
  estado: EstadoEncargo
): boolean {
  if (rol === 'admin') return estado !== 'aprobado'
  return estado === 'en_progreso' || estado === 'cambios'
}

/** "1.2 MB", "830 KB" — para la UI. */
export function formatoTamano(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/** Aceptados por el input file de la UI. */
export const ACCEPT_EVIDENCIA = [
  ...Object.keys(MIME_A_EXTENSION),
  ...VARIANTES_ZIP,
].join(',')
