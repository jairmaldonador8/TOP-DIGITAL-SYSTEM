import { FAQS, type Faq } from '@/lib/sitio/contenido'

/**
 * Buscador de preguntas frecuentes que responde en el navegador, sin
 * llamadas a ningún servicio. Compara la pregunta escrita contra el título,
 * las palabras clave y el texto de cada respuesta, tolerando acentos,
 * plurales y variaciones ("cuanto cuesta" ≈ "precios").
 */

const VACIAS = new Set([
  'a', 'al', 'algo', 'como', 'con', 'cual', 'cuales', 'de', 'del', 'donde',
  'el', 'ella', 'ellos', 'en', 'era', 'es', 'esa', 'ese', 'eso', 'esta',
  'estan', 'este', 'esto', 'hay', 'la', 'las', 'le', 'lo', 'los',
  'mas', 'me', 'mi', 'mis', 'muy', 'no', 'nos', 'o', 'para', 'pero', 'por',
  'porque', 'que', 'se', 'si', 'sin', 'sobre', 'son', 'su', 'sus',
  'tan', 'te', 'tu', 'tus', 'un', 'una', 'uno', 'unos', 'y', 'ya',
])

/** Minúsculas sin acentos ni signos, para comparar peras con peras. */
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Longitud mínima de una raíz para que se pueda comparar por prefijo. */
const MINIMO = 4

/**
 * Raíz aproximada: recorta plurales y terminaciones comunes del español.
 *
 * Si el recorte deja un muñón (menos de MINIMO letras) se conserva la
 * palabra completa. Sin esa guarda, "cuándo" perdía su falso gerundio
 * "-ando" y quedaba en "cu", que hacía prefijo con "cuánto" y "cuesta" y
 * mandaba las preguntas de precio a la respuesta de tiempos.
 */
function raiz(palabra: string) {
  const recortada = palabra.replace(
    /(ciones|cion|mente|ando|iendo|ados|idos|es|as|os|a|o|s)$/,
    ''
  )
  return (recortada.length >= MINIMO ? recortada : palabra).slice(0, 8)
}

/**
 * Dos raíces coinciden si son iguales o si una es prefijo de la otra —
 * pero solo cuando el prefijo ya es lo bastante largo para significar
 * algo, para que "web" no se coma "webinar" ni al revés.
 */
function coincide(a: string, b: string) {
  if (a === b) return true
  if (a.length >= MINIMO && b.startsWith(a)) return true
  return b.length >= MINIMO && a.startsWith(b)
}

function tokens(texto: string) {
  return normalizar(texto)
    .split(' ')
    .filter((t) => t.length > 1 && !VACIAS.has(t))
}

export type Coincidencia = { faq: Faq; puntaje: number }

/**
 * Devuelve las FAQs ordenadas por relevancia. `puntaje` va de 0 a 1: por
 * debajo de UMBRAL_CONFIANZA conviene tratarlo como "no encontré esa
 * pregunta" y ofrecer la videollamada.
 */
export function buscarFaqs(consulta: string): Coincidencia[] {
  const buscados = tokens(consulta)
  if (buscados.length === 0) return []

  const resultados = FAQS.map((faq) => {
    const enPregunta = tokens(faq.pregunta).map(raiz)
    const enClaves = faq.claves.flatMap((c) => tokens(c)).map(raiz)
    const enRespuesta = tokens(faq.respuesta).map(raiz)

    let puntaje = 0
    for (const token of buscados) {
      const r = raiz(token)
      if (r.length < 2) continue
      // La palabra clave es la señal más fuerte: la eligió quien escribió la FAQ.
      if (enClaves.some((c) => coincide(c, r))) {
        puntaje += 4
      } else if (enPregunta.some((p) => coincide(p, r))) {
        puntaje += 3
      } else if (enRespuesta.some((p) => p === r)) {
        puntaje += 1
      }
    }

    return { faq, puntaje: puntaje / (buscados.length * 4) }
  })

  return resultados
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
}

/** Umbral a partir del cual Topi contesta con seguridad. */
export const UMBRAL_CONFIANZA = 0.25
