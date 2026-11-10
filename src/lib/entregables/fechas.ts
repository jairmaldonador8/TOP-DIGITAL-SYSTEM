/**
 * Fechas de entregables (spec 2026-11-09 §Generador). Trabaja con cadenas
 * YYYY-MM-DD ancladas a mediodía UTC para no correrse por zona horaria.
 * Días hábiles = lunes a viernes, sin feriados por ahora.
 */
const DIA = 86_400_000

function aFecha(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d, 12))
}
function aIso(f: Date): string {
  return f.toISOString().slice(0, 10)
}
function esHabil(f: Date): boolean {
  const d = f.getUTCDay()
  return d !== 0 && d !== 6
}

function moverDiasHabiles(iso: string, dias: number, signo: 1 | -1): string {
  let f = aFecha(iso)
  let n = 0
  while (n < dias) {
    f = new Date(f.getTime() + signo * DIA)
    if (esHabil(f)) n++
  }
  return aIso(f)
}

export const sumarDiasHabiles = (iso: string, dias: number) => moverDiasHabiles(iso, dias, 1)
export const restarDiasHabiles = (iso: string, dias: number) => moverDiasHabiles(iso, dias, -1)

/** Fecha interna del equipo: 2 días hábiles antes de la fecha al cliente. */
export const fechaInterna = (fechaCliente: string) => restarDiasHabiles(fechaCliente, 2)

/** Días hábiles desde `desde` hasta `hasta` (negativo si `hasta` ya pasó). */
export function diasHabilesEntre(desde: string, hasta: string): number {
  const a = aFecha(desde)
  const b = aFecha(hasta)
  const signo = b >= a ? 1 : -1
  let f = a
  let n = 0
  while (aIso(f) !== aIso(b)) {
    f = new Date(f.getTime() + signo * DIA)
    if (esHabil(f)) n += signo
  }
  return n
}

/** Próximos `cuantos` ciclos (días 1 y 15) a partir de `hoy`, incluido. */
export function siguientesCiclos(hoy: string, cuantos = 2): string[] {
  const [a, m, d] = hoy.split('-').map(Number)
  const salida: string[] = []
  let anio = a
  let mes = m
  let dia = d <= 1 ? 1 : d <= 15 ? 15 : 0
  while (salida.length < cuantos) {
    if (dia === 0) {
      mes++
      if (mes > 12) { mes = 1; anio++ }
      dia = 1
    }
    salida.push(`${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)
    dia = dia === 1 ? 15 : 0
  }
  return salida
}
