/** Piezas de la pantalla Mi día (spec 2026-09-25-agenda-tadeo). */

export type CitaDia = {
  id: string
  titulo: string
  fecha: string // YYYY-MM-DD
  hora: string | null // HH:MM (null = todo el día)
  horaFin: string | null
  lugar: string | null
  cliente: string | null
  origen: 'sistema' | 'google'
  avisoMin: number | null
  descripcion: string | null
  clienteId: string | null
  tipo: string // evento_tipo: junta | sesion | lanzamiento | pago | otro
}

export type PendienteDia = {
  id: string
  titulo: string
  fecha: string | null
  hora: string | null
  cliente: string | null
  // Estado antes de completarla: el "Deshacer" la regresa a este.
  estado: 'pendiente' | 'en_progreso'
  atrasado: boolean
}

export type EntregaDia = {
  id: string
  titulo: string
  fecha: string
  integrante: string
  atrasada: boolean
}

export type MiDia = {
  citas: CitaDia[]
  pendientes: PendienteDia[]
  entregas: EntregaDia[]
  conteo: { citas: number; pendientes: number; entregasHoy: number; atrasados: number }
}
