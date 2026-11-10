import { ETIQUETA_TIPO, PUESTO_POR_TIPO, type Puesto } from '@/lib/equipo/puestos'

import { fechaInterna } from './fechas'

export type TipoCiclo = keyof typeof PUESTO_POR_TIPO
export type Cuota = Partial<Record<TipoCiclo, number>>

/** Orden de creación: la producción primero para que los videos la referencien. */
const ORDEN: TipoCiclo[] = ['produccion', 'guion', 'imagen', 'carrusel', 'video']

export type PiezaCiclo = {
  tipo: TipoCiclo
  pieza: number
  titulo: string
  puesto: Puesto
  asignadoA: string
  sinResponsable: boolean
  fechaCliente: string
  fechaLimite: string
  prioridad: 'alta' | 'media'
  estadoInicial: 'pendiente' | 'esperando'
  dependeDeProduccion: boolean
}

export function cantidadValida(v: unknown): number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 50 ? v : 0
}

export function piezasDelCiclo(args: {
  ciclo: string
  cuota: Cuota
  equipo: Partial<Record<Puesto, string>>
  responsablePorDefecto: string
  esNuevo: boolean
}): PiezaCiclo[] {
  const { ciclo, cuota, equipo, responsablePorDefecto, esNuevo } = args
  const hayProduccion = cantidadValida(cuota.produccion) > 0
  const salida: PiezaCiclo[] = []

  for (const tipo of ORDEN) {
    const n = cantidadValida(cuota[tipo])
    const puesto = PUESTO_POR_TIPO[tipo]
    const responsable = equipo[puesto]
    for (let i = 1; i <= n; i++) {
      const esperando = tipo === 'video' && hayProduccion
      salida.push({
        tipo,
        pieza: i,
        titulo: `${ETIQUETA_TIPO[tipo]} ${i}`,
        puesto,
        asignadoA: responsable ?? responsablePorDefecto,
        sinResponsable: !responsable,
        fechaCliente: ciclo,
        fechaLimite: fechaInterna(ciclo),
        prioridad: esNuevo ? 'alta' : 'media',
        estadoInicial: esperando ? 'esperando' : 'pendiente',
        dependeDeProduccion: esperando,
      })
    }
  }
  return salida
}
