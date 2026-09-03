import type { Metadata } from 'next'

import { CambiarIdea } from '@/app/ideas/_piezas/cambiar'

export const metadata: Metadata = {
  title: 'Ideas de dirección visual',
  // Taller interno: nunca debe indexarse ni aparecer en resultados.
  robots: { index: false, follow: false },
}

/**
 * Taller de direcciones visuales para el sitio de la agencia.
 *
 * Cada ruta de aquí es una PROPUESTA completa del inicio con el mismo
 * contenido real, cambiando solo la dirección de arte. No comparten
 * layout con `(sitio)` a propósito: cada idea trae su propia navegación,
 * su propio color de fondo y su propia tipografía. Cuando se elija una,
 * esta carpeta entera se borra.
 */
export default function LayoutIdeas({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <CambiarIdea />
    </>
  )
}
