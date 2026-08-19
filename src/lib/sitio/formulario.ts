/**
 * Opciones del formulario de diagnóstico. Viven aquí porque las usan tanto
 * el formulario (para pintar los selects) como la Server Action (para
 * validar que lo recibido sea una de ellas).
 */

export const FACTURACION = [
  'Menos de $50,000 MXN',
  '$50,000 – $150,000 MXN',
  '$150,000 – $500,000 MXN',
  '$500,000 – $1,000,000 MXN',
  'Más de $1,000,000 MXN',
  'Prefiero no decirlo',
] as const

export const SI_NO = ['Sí', 'No'] as const

export const PRESUPUESTO = [
  'Menos de $5,000 MXN',
  '$5,000 – $15,000 MXN',
  '$15,000 – $30,000 MXN',
  '$30,000 – $90,000 MXN',
  'Más de $90,000 MXN',
  'Aún no lo tengo definido',
] as const

export const ARRANQUE = [
  'Lo antes posible',
  'En las próximas 2 semanas',
  'Este mes',
  'En 1 a 3 meses',
  'Solo estoy explorando',
] as const
