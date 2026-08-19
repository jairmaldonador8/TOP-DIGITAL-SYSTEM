import type { Metadata } from 'next'

import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'

export const metadata: Metadata = {
  title: {
    default: 'Top Digital · Somos resultados TOP en lo digital',
    template: '%s · Top Digital',
  },
  description:
    'Agencia de marketing, marca y tecnología. Branding, páginas web, tiendas en línea, chatbots con IA, sistemas a la medida y campañas en Meta y Google Ads. Más de 100 empresas y +$1M invertidos en anuncios.',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Top Digital',
  },
}

/**
 * Sitio público de la agencia. Vive en su propio grupo de rutas para no
 * compartir layout con la plataforma (`(app)`): aquí no hay sesión ni
 * navegación de producto, solo la marca y un CTA constante.
 */
export default function LayoutSitio({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">{children}</main>
      <FooterSitio />
    </div>
  )
}
