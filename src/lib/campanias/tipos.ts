/** Estados de campania (enum estado_campania en Postgres, ver 0001/0008). */
export const ESTADOS_CAMPANIA = ['activa', 'pausada', 'archivada'] as const
export type EstadoCampania = (typeof ESTADOS_CAMPANIA)[number]
