import { describe, expect, it } from 'vitest'

import { leerCuota, leerKit } from '../ficha'

describe('leerCuota', () => {
  it('toma enteros 0–50 de cada tipo y omite los vacíos', () => {
    const fd = new FormData()
    fd.set('cuota_imagen', '6'); fd.set('cuota_video', '2'); fd.set('cuota_carrusel', '')
    expect(leerCuota(fd)).toEqual({ ok: true, cuota: { imagen: 6, video: 2 } })
  })
  it('rechaza negativos, decimales y más de 50', () => {
    const fd = new FormData()
    fd.set('cuota_imagen', '-1'); fd.set('cuota_video', '1.5'); fd.set('cuota_guion', '99')
    const r = leerCuota(fd)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['cuota_guion', 'cuota_imagen', 'cuota_video'])
  })
})

describe('leerKit', () => {
  it('separa colores hex válidos y tipografías por coma', () => {
    const fd = new FormData()
    fd.set('colores', '#921817, #FFF, rojo'); fd.set('tipografias', 'Poppins, DM Serif')
    fd.set('tono', 'Cercano'); fd.set('notas_marca', '')
    expect(leerKit(fd)).toEqual({
      colores: ['#921817', '#FFF'], tipografias: ['Poppins', 'DM Serif'], tono: 'Cercano', notas: null,
    })
  })
})
