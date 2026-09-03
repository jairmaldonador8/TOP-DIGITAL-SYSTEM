import 'server-only'

import { RESENAS, type Resena } from '@/lib/sitio/contenido'

/**
 * Reseñas de Google para el carrusel del sitio.
 *
 * ── ESTADO: apagado hasta tener credenciales ──────────────────────────
 * Faltan dos datos que solo puede dar el cliente:
 *   · GOOGLE_PLACES_API_KEY — llave de Google Cloud con la "Places API
 *     (New)" habilitada y restringida por IP de servidor.
 *   · GOOGLE_PLACE_ID       — identificador de la ficha de Top Digital en
 *     Google Business. Se saca del enlace de su ficha o del buscador de
 *     Place ID de Google.
 * Mientras falten, `obtenerResenas()` devuelve las de `contenido.ts` y el
 * sitio funciona igual.
 *
 * ── LÍMITE IMPORTANTE ─────────────────────────────────────────────────
 * La Places API devuelve **como máximo 5 reseñas** por ficha, elegidas
 * por Google — no hay parámetro para pedir todas ni para paginar. Para
 * traerlas TODAS hace falta la Google Business Profile API, que exige ser
 * dueño verificado de la ficha y pasar por OAuth. Las funciones de abajo
 * cubren el camino de 5 reseñas; el otro se implementa cuando el cliente
 * conceda el acceso a su perfil.
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places'

/** Cada cuánto se refresca la caché de reseñas (12 h). */
const REVALIDAR_S = 60 * 60 * 12

type ResenaPlaces = {
  rating?: number
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string }
  relativePublishTimeDescription?: string
}

type RespuestaPlaces = {
  reviews?: ResenaPlaces[]
  rating?: number
  userRatingCount?: number
}

export type ResumenResenas = {
  resenas: Resena[]
  /** Calificación promedio de la ficha, si vino de Google. */
  promedio: number | null
  /** Total de reseñas de la ficha (puede ser mayor que `resenas.length`). */
  total: number | null
  /** true = son las de plantilla, no las reales. */
  esPlantilla: boolean
}

function traducir(r: ResenaPlaces): Resena | null {
  const texto = (r.text?.text ?? r.originalText?.text ?? '').trim()
  const autor = r.authorAttribution?.displayName?.trim()
  if (!texto || !autor) return null
  return {
    autor,
    // Google no expone el negocio del autor; se deja vacío y la tarjeta
    // simplemente no pinta esa línea.
    negocio: '',
    texto,
    estrellas: Math.round(r.rating ?? 5),
    fuente: 'google',
    fecha: r.relativePublishTimeDescription ?? '',
    pendiente: false,
  }
}

/**
 * Devuelve las reseñas para el carrusel. Nunca lanza: si Google falla o
 * no hay credenciales, cae a las de `contenido.ts` para que la sección
 * siga en pie.
 */
export async function obtenerResenas(): Promise<ResumenResenas> {
  const llave = process.env.GOOGLE_PLACES_API_KEY
  const ficha = process.env.GOOGLE_PLACE_ID

  // Ojo: el respaldo ya NO es de relleno. Desde el 20-ago `RESENAS` son
  // las recomendaciones REALES de la página de Facebook, transcritas a
  // mano. Por eso `esPlantilla` va en false: si fuera true, el sitio
  // pondría bajo el carrusel el aviso "Reseñas de ejemplo", que sería
  // mentira y le quitaría fuerza justo a la prueba social.
  const respaldo: ResumenResenas = {
    resenas: RESENAS,
    promedio: null,
    total: null,
    esPlantilla: false,
  }

  if (!llave || !ficha) return respaldo

  try {
    const res = await fetch(`${PLACES_ENDPOINT}/${ficha}`, {
      headers: {
        'X-Goog-Api-Key': llave,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
      },
      next: { revalidate: REVALIDAR_S },
    })
    if (!res.ok) return respaldo

    const datos = (await res.json()) as RespuestaPlaces
    const resenas = (datos.reviews ?? [])
      .map(traducir)
      .filter((r): r is Resena => r !== null)

    if (resenas.length === 0) return respaldo

    return {
      resenas,
      promedio: datos.rating ?? null,
      total: datos.userRatingCount ?? null,
      esPlantilla: false,
    }
  } catch {
    // Sin red o respuesta inesperada: el sitio no se cae por esto.
    return respaldo
  }
}
