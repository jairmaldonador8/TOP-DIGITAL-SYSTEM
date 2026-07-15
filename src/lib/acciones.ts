/**
 * Plumbing compartido para Server Actions de formularios (clientes, y las
 * Tareas 8-9: leads y campañas). NO es un archivo 'use server': solo
 * exporta helpers y tipos que las actions importan.
 */
import { usuarioActual } from '@/lib/auth/usuario-actual'

/**
 * Resultado estándar de las acciones de formulario: en caso de error se
 * devuelven los valores capturados para repoblar el formulario (React 19
 * resetea los <form> después de cada action).
 */
export type ResultadoAccion =
  | { ok: true; email?: string }
  | {
      ok: false
      errores: Record<string, string>
      valores: Record<string, string>
    }
  | null

export const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  errores: { _form: 'No tienes permiso para realizar esta acción' },
  valores: {},
}

/** Los Server Actions nunca confían en la UI: re-verifican el rol admin. */
export async function esAdmin(): Promise<boolean> {
  const actual = await usuarioActual()
  return actual.rol === 'admin'
}

/** Extrae los campos de texto de un FormData para validar y repoblar. */
export function valoresDe(
  formData: FormData,
  campos: string[]
): Record<string, string> {
  const valores: Record<string, string> = {}
  for (const campo of campos) {
    const valor = formData.get(campo)
    if (typeof valor === 'string') valores[campo] = valor
  }
  return valores
}
