import { describe, expect, it } from 'vitest'

import { buscarFaqs, normalizar, UMBRAL_CONFIANZA } from '@/lib/sitio/buscar-faq'

/** La FAQ que Topi contestaría para esa consulta. */
function mejor(consulta: string) {
  const [primera] = buscarFaqs(consulta)
  return primera?.faq.pregunta
}

describe('normalizar', () => {
  it('quita acentos y signos', () => {
    expect(normalizar('¿Cuánto CUESTA, más o menos?')).toBe(
      'cuanto cuesta mas o menos'
    )
  })
})

describe('buscarFaqs', () => {
  it('responde precios cuando preguntan cuánto cuesta algo', () => {
    expect(mejor('cuanto cuesta una pagina web')).toBe(
      '¿Cuánto cuesta trabajar con ustedes?'
    )
    expect(mejor('precios')).toBe('¿Cuánto cuesta trabajar con ustedes?')
    expect(mejor('qué tan caro es')).toBe('¿Cuánto cuesta trabajar con ustedes?')
  })

  it('distingue tiempos de precios', () => {
    expect(mejor('en cuanto tiempo veo resultados')).toBe(
      '¿En cuánto tiempo veo resultados?'
    )
    expect(mejor('cuanto tardan en entregar')).toBe(
      '¿En cuánto tiempo veo resultados?'
    )
  })

  it('encuentra las demás por sus palabras clave', () => {
    expect(mejor('la llamada es gratis?')).toBe(
      '¿La videollamada de diagnóstico realmente es gratis?'
    )
    expect(mejor('hay permanencia forzosa')).toBe(
      '¿Hay contrato o permanencia forzosa?'
    )
    expect(mejor('puedo ver mis reportes')).toBe('¿Puedo ver cómo van mis campañas?')
    expect(mejor('atienden fuera de mi ciudad')).toBe(
      '¿Atienden fuera de mi ciudad?'
    )
    expect(mejor('que es el servicio premium')).toBe(
      '¿Qué es el departamento de marketing externo?'
    )
  })

  it('no contesta con seguridad lo que no tiene cargado', () => {
    const [primera] = buscarFaqs('hacen fotografia aerea con drone')
    expect(primera?.puntaje ?? 0).toBeLessThan(UMBRAL_CONFIANZA)
  })

  it('devuelve vacío sin consulta útil', () => {
    expect(buscarFaqs('')).toEqual([])
    expect(buscarFaqs('de la')).toEqual([])
  })
})
