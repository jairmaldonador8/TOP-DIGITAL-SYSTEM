/**
 * Máquina de estados de encargos (spec 2026-07-23-equipo-encargos §1/§4).
 * El trabajador avanza su trabajo; el dueño revisa. `aprobado` es terminal
 * para todos. Las server actions consultan esta función; la base además la
 * respalda con RLS + trigger (migración 0015).
 */

export const ESTADOS_ENCARGO = [
  'pendiente',
  'en_progreso',
  'entregado',
  'cambios',
  'aprobado',
] as const

export type EstadoEncargo = (typeof ESTADOS_ENCARGO)[number]

export const PRIORIDADES_ENCARGO = ['alta', 'media', 'baja'] as const
export type PrioridadEncargo = (typeof PRIORIDADES_ENCARGO)[number]

const VALIDAS: Record<'equipo' | 'admin', Partial<Record<EstadoEncargo, EstadoEncargo[]>>> = {
  equipo: {
    pendiente: ['en_progreso'],
    cambios: ['en_progreso'],
    en_progreso: ['entregado'],
  },
  admin: {
    entregado: ['aprobado', 'cambios'],
  },
}

export function puedeTransicionar(
  rol: 'equipo' | 'admin',
  de: EstadoEncargo,
  a: EstadoEncargo
): boolean {
  return VALIDAS[rol][de]?.includes(a) ?? false
}
