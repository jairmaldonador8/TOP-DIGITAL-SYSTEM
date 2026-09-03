import type { Metadata } from 'next'

import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'

export const metadata: Metadata = {
  title: {
    default: 'Top Digital · Somos resultados TOP en lo digital',
    template: '%s · Top Digital',
  },
  description:
    'Agencia de marketing, marca y tecnología. Branding, páginas web, tiendas en línea, chatbots con IA, sistemas a la medida y campañas en Meta Ads. Más de 100 empresas y +$1M invertidos en anuncios.',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Top Digital',
  },
}

/** Carbón: un único color de fondo para todo el sitio, de arriba a abajo. */
const FONDO = '#0a0a0c'

/**
 * Sitio público de la agencia. Vive en su propio grupo de rutas para no
 * compartir layout con la plataforma (`(app)`): aquí no hay sesión ni
 * navegación de producto, solo la marca y un CTA constante.
 *
 * El fondo se reescribe aquí y no en `globals.css` a propósito: ese token
 * lo comparten el sitio y la plataforma, y el tema del CRM ya está
 * aprobado. Al pisar `--background` en este contenedor, todo lo que use
 * `bg-background` dentro del sitio (incluida la nav) hereda el carbón sin
 * mover un pixel de la plataforma.
 */
export default function LayoutSitio({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-svh w-full max-w-full min-w-0 flex-col overflow-x-hidden bg-background"
      style={{ '--background': FONDO } as React.CSSProperties}
    >
      {/*
        Dos reglas que solo aplican en el sitio, nunca en la plataforma:
        este <style> se monta con este layout y no viaja a `(app)`.

        1. `overflow-x: clip` en la raíz: red de seguridad contra el scroll
           lateral. Se usa `clip` y no `hidden` porque `hidden` en <html>
           convierte la raíz en contenedor de scroll y rompe `position:
           sticky` de la navegación.
        2. Barra de scroll oculta, a petición del cliente. Se sigue
           pudiendo desplazar con rueda, teclado y gesto — solo se quita
           el indicador visual.
      */}
      <style>{`
        html, body { overflow-x: clip; max-width: 100%; }
        html { scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>
      <NavSitio />
      <main className="w-full min-w-0 flex-1">{children}</main>
      <FooterSitio />
    </div>
  )
}
