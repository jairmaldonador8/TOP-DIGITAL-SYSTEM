import type { MiDia } from '@/lib/agenda/tipos'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Tarjeta de marca con el resumen del día (se omiten las partes en 0). */
export function TarjetaDia({ conteo }: { conteo: MiDia['conteo'] }) {
  const principal = [
    conteo.citas > 0 ? plural(conteo.citas, 'cita', 'citas') : null,
    conteo.pendientes > 0 ? plural(conteo.pendientes, 'pendiente', 'pendientes') : null,
  ].filter(Boolean).join(' · ')
  const secundaria = [
    conteo.entregasHoy > 0
      ? `${plural(conteo.entregasHoy, 'entrega', 'entregas')} ${conteo.entregasHoy === 1 ? 'vence' : 'vencen'} hoy`
      : null,
    conteo.atrasados > 0 ? plural(conteo.atrasados, 'atrasado', 'atrasados') : null,
  ].filter(Boolean).join(' · ')

  const libre = !principal && !secundaria

  return (
    <div data-tour="metricas" className="bg-marca rounded-3xl p-5 text-white shadow-lg shadow-marca-magenta/20">
      <p className="text-xl font-bold leading-tight">
        {libre ? 'Día libre ✨' : principal || secundaria}
      </p>
      {libre ? (
        <p className="mt-1 text-sm text-white/85">Nada agendado ni pendiente para hoy.</p>
      ) : principal && secundaria ? (
        <p className="mt-1 text-sm text-white/85">{secundaria}</p>
      ) : null}
    </div>
  )
}
