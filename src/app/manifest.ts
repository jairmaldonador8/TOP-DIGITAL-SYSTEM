import type { MetadataRoute } from 'next'

/**
 * Manifest PWA: permite instalar el sitio como app (Agregar a pantalla de
 * inicio) con icono de marca y pantalla completa, sin barra del navegador.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Top Digital',
    short_name: 'Top Digital',
    description:
      'Plataforma de Top Digital: seguimiento de leads, campañas y resultados para tu negocio.',
    // id fijo: no cambiarlo nunca (identifica la app instalada).
    id: '/',
    // start_url '/' y no '/agencia': el portal también se instala y el
    // proxy redirige por rol.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0d0b10',
    theme_color: '#0d0b10',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icono-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
