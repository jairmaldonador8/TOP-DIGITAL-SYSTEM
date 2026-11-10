export const PUESTOS = [
  'project_manager', 'media_buyer', 'filmmaker', 'editor', 'disenador', 'vendedor',
] as const
export type Puesto = (typeof PUESTOS)[number]

export const TIPOS_ENTREGABLE = ['imagen', 'carrusel', 'video', 'produccion', 'guion'] as const
export type TipoEntregable = (typeof TIPOS_ENTREGABLE)[number] | 'otro'

export const ETIQUETA_PUESTO: Record<Puesto, string> = {
  project_manager: 'Project Manager',
  media_buyer: 'Media buyer',
  filmmaker: 'Filmmaker',
  editor: 'Editor',
  disenador: 'Diseñador gráfico',
  vendedor: 'Vendedor',
}

export const ETIQUETA_TIPO: Record<TipoEntregable, string> = {
  imagen: 'Imagen', carrusel: 'Carrusel', video: 'Video',
  produccion: 'Producción', guion: 'Guion', otro: 'Encargo',
}

/** Quién atiende cada tipo de pieza de ciclo. */
export const PUESTO_POR_TIPO: Record<Exclude<TipoEntregable, 'otro'>, Puesto> = {
  imagen: 'disenador', carrusel: 'disenador', video: 'editor',
  produccion: 'filmmaker', guion: 'project_manager',
}

/** Verbo del botón principal en la bandeja, según el tipo de pieza. */
export const ACCION_POR_TIPO: Record<TipoEntregable, string> = {
  imagen: 'Entregar post', carrusel: 'Entregar carrusel', video: 'Entregar video',
  produccion: 'Subir material', guion: 'Entregar guion', otro: 'Entregar',
}

export function esPuesto(v: unknown): v is Puesto {
  return typeof v === 'string' && (PUESTOS as readonly string[]).includes(v)
}
