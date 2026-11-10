import { cantidadValida, type Cuota } from '@/lib/entregables/ciclo'
import { TIPOS_ENTREGABLE } from '@/lib/equipo/puestos'

export type KitMarca = {
  colores: string[]
  tipografias: string[]
  tono: string | null
  notas: string | null
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function leerCuota(
  fd: FormData
): { ok: true; cuota: Cuota } | { ok: false; errores: Record<string, string> } {
  const cuota: Cuota = {}
  const errores: Record<string, string> = {}
  for (const tipo of TIPOS_ENTREGABLE) {
    const crudo = String(fd.get(`cuota_${tipo}`) ?? '').trim()
    if (crudo === '' || Number(crudo) === 0) continue
    const n = Number(crudo)
    if (!cantidadValida(n)) {
      errores[`cuota_${tipo}`] = 'Un número entero entre 0 y 50'
      continue
    }
    cuota[tipo] = n
  }
  return Object.keys(errores).length ? { ok: false, errores } : { ok: true, cuota }
}

function lista(v: FormDataEntryValue | null): string[] {
  return String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}
function texto(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

export function leerKit(fd: FormData): KitMarca {
  return {
    colores: lista(fd.get('colores')).filter((c) => HEX.test(c)),
    tipografias: lista(fd.get('tipografias')),
    tono: texto(fd.get('tono')),
    notas: texto(fd.get('notas_marca')),
  }
}
