import { CONTACTO } from '@/lib/sitio/contenido'

/**
 * Cuentas y tipos de contenido de la sección de redes.
 *
 * Las cuentas salen de `CONTACTO`; los temas de contenido salen de lo que
 * la propia sección ya decía que se publica en cada red. No hay métricas
 * inventadas —seguidores, likes, alcance— porque no las tenemos.
 */
export const CUENTAS = [
  {
    nombre: 'Instagram',
    cuenta: '@somos.top.digital',
    href: CONTACTO.instagram,
    detalle: 'Consejos y detrás de cámaras',
    tinte: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
  },
  {
    nombre: 'Facebook',
    cuenta: 'Top Digital Company',
    href: CONTACTO.facebook,
    detalle: 'Casos y reseñas de clientes',
    tinte: 'from-[#0866ff] to-[#0653c8]',
  },
  {
    nombre: 'TikTok',
    cuenta: '@somostopdigital',
    href: CONTACTO.tiktok,
    detalle: 'Tips rápidos de marketing',
    tinte: 'from-[#25f4ee] via-[#000000] to-[#fe2c55]',
  },
  {
    nombre: 'LinkedIn',
    cuenta: '/somos-top-digital',
    href: CONTACTO.linkedin,
    detalle: 'Estrategia para empresas',
    tinte: 'from-[#0a66c2] to-[#004182]',
  },
  {
    nombre: 'YouTube',
    cuenta: '@SomosTopDigital',
    href: CONTACTO.youtube,
    detalle: 'Tutoriales y casos a fondo',
    tinte: 'from-[#ff0000] to-[#c40000]',
  },
]

/** Los tipos de contenido que se publican, no publicaciones inventadas. */
export const CONTENIDOS = [
  {
    etiqueta: 'Consejo',
    titulo: 'Los 3 errores que te están costando clientes cada mes',
    formato: 'Carrusel',
  },
  {
    etiqueta: 'Caso',
    titulo: 'Antes y después de un rebranding completo',
    formato: 'Publicación',
  },
  {
    etiqueta: 'Resultado',
    titulo: 'Cómo se ve una campaña que sí vende, por dentro',
    formato: 'Reel',
  },
  {
    etiqueta: 'Detrás de cámaras',
    titulo: 'Un día de grabación con el equipo',
    formato: 'Historia',
  },
  {
    etiqueta: 'Tutorial',
    titulo: 'Configura tu WhatsApp Business en 5 minutos',
    formato: 'Video',
  },
  {
    etiqueta: 'Cliente nuevo',
    titulo: 'Le damos la bienvenida al equipo que confía en nosotros',
    formato: 'Publicación',
  },
]
