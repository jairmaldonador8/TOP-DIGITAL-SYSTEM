import { diasHabilesEntre } from './fechas'

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'

export function semaforo(args: {
  estado: string
  fechaLimite: string | null
  hoy: string
}): Semaforo {
  const { estado, fechaLimite, hoy } = args
  if (estado === 'esperando') return 'gris'
  if (estado === 'entregado' || estado === 'aprobado') return 'verde'
  if (!fechaLimite) return 'verde'
  if (fechaLimite < hoy) return 'rojo'
  return diasHabilesEntre(hoy, fechaLimite) <= 1 ? 'amarillo' : 'verde'
}
