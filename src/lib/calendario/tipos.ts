/** Elemento unificado del calendario de operación (4 fuentes). */

export type TipoElemento = 'campania' | 'encargo' | 'tarea' | 'evento'

export type ElementoCalendario = {
  id: string
  /** 'campania:<id>' | 'encargo:<id>' | 'tarea:<id>' | 'evento:<id>' */
  uid: string
  /** YYYY-MM-DD (hora de México, patrón #418). */
  fecha: string
  /** HH:MM o null = todo el día. */
  hora: string | null
  titulo: string
  /** Contexto: nombre del cliente o del integrante. */
  detalle: string | null
  tipo: TipoElemento
  /** evento_tipo cuando tipo = 'evento'. */
  subtipo: string | null
  /** Liga interna para la agenda. */
  href: string
}
