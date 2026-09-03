/**
 * Enlaces del sitio hacia la plataforma (CRM).
 *
 * Cuando el sitio se sirve desde su propio dominio, el proyecto de Vercel
 * define `NEXT_PUBLIC_URL_PLATAFORMA` con el origen del sistema y los
 * enlaces salen absolutos. En el despliegue conjunto (sin la variable)
 * quedan relativos y todo vive bajo el mismo dominio.
 */
const URL_PLATAFORMA = (process.env.NEXT_PUBLIC_URL_PLATAFORMA ?? '').replace(
  /\/$/,
  ''
)

export const URL_LOGIN = `${URL_PLATAFORMA}/login`
