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
  /** Solo citas (tipo 'evento'): HH:MM de fin. */
  horaFin: string | null
  lugar: string | null
  origen: 'sistema' | 'google' | null
  avisoMin: number | null
  /** Solo citas: datos crudos para abrir el formulario de edición. */
  descripcion: string | null
  clienteId: string | null
}
