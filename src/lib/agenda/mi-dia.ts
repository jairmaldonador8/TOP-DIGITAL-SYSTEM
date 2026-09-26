/**
 * Arma la pantalla Mi día a partir de filas ya cargadas (función pura:
 * recibe `hoy` en hora de México para ser determinista en pruebas).
 */
import type { CitaDia, EntregaDia, MiDia, PendienteDia } from './tipos'

type PendienteCrudo = Omit<PendienteDia, 'atrasado'>
type EntregaCruda = Omit<EntregaDia, 'atrasada'>

export function construirMiDia(entrada: {
  hoy: string
  citas: CitaDia[]
  pendientes: PendienteCrudo[]
  entregas: EntregaCruda[]
}): MiDia {
  const { hoy } = entrada

  const citas = entrada.citas
    .filter((c) => c.fecha === hoy)
    .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? '') || a.titulo.localeCompare(b.titulo, 'es'))

  const rango = (p: PendienteCrudo) => (p.fecha === null ? 2 : p.fecha < hoy ? 0 : 1)
  const pendientes: PendienteDia[] = entrada.pendientes
    .filter((p) => p.fecha === null || p.fecha <= hoy)
    .map((p) => ({ ...p, atrasado: p.fecha !== null && p.fecha < hoy }))
    .sort(
      (a, b) =>
        rango(a) - rango(b) ||
        (a.fecha ?? '').localeCompare(b.fecha ?? '') ||
        // Sin hora primero (como las citas de todo el día), luego por hora.
        (a.hora ?? '').localeCompare(b.hora ?? '') ||
        a.titulo.localeCompare(b.titulo, 'es')
    )

  const entregas: EntregaDia[] = entrada.entregas
    .filter((e) => e.fecha <= hoy)
    .map((e) => ({ ...e, atrasada: e.fecha < hoy }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es'))

  return {
    citas,
    pendientes,
    entregas,
    conteo: {
      citas: citas.length,
      pendientes: pendientes.length,
      entregasHoy: entregas.filter((e) => !e.atrasada).length,
      atrasados:
        pendientes.filter((p) => p.atrasado).length + entregas.filter((e) => e.atrasada).length,
    },
  }
}
