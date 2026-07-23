/**
 * Semáforo de salud de campañas (ventana de 7 días). Reglas puras del spec
 * docs/ultrapowers/specs/2026-07-23-campanias-semaforo-design.md §2: se
 * evalúan EN ORDEN y gana la primera que aplique — así los casos raros
 * (conversaciones sin gasto, cliente sin historial) caen donde deben sin
 * traslapes.
 */
import type { EstadoCampania } from './tipos'

export type Salud = 'verde' | 'ambar' | 'rojo' | 'gris'

export function saludCampania({
  estado,
  gasto7d,
  conversaciones7d,
  promedioCliente,
}: {
  estado: EstadoCampania
  gasto7d: number
  conversaciones7d: number
  /** CPL histórico del cliente; null si no tiene conversaciones de vida. */
  promedioCliente: number | null
}): Salud {
  // 1. Gris: no está corriendo o no consumió esta semana (incluye la
  // atribución tardía: conversaciones con gasto 0 no se evalúan por costo).
  if (estado !== 'activa' || gasto7d === 0) return 'gris'

  // 2. Rojo: gastó sin generar nada, o el costo se disparó a más del doble
  // del promedio del cliente (solo si hay promedio con qué comparar).
  const cpl7d = conversaciones7d > 0 ? gasto7d / conversaciones7d : null
  if (cpl7d === null) return 'rojo'
  if (promedioCliente !== null && cpl7d > 2 * promedioCliente) return 'rojo'

  // 3. Verde: igual o mejor que el promedio; sin historial, generar ya es
  // buena señal.
  if (promedioCliente === null || cpl7d <= promedioCliente) return 'verde'

  // 4. Ámbar: el resto (entre 1× y 2× el promedio, inclusive).
  return 'ambar'
}

/** CPL histórico del cliente: suma de vida de todas sus campañas. */
export function promedioCPL(
  filas: { gasto: number; conversaciones: number }[]
): number | null {
  let gasto = 0
  let conversaciones = 0
  for (const fila of filas) {
    gasto += fila.gasto
    conversaciones += fila.conversaciones
  }
  return conversaciones > 0 ? gasto / conversaciones : null
}
