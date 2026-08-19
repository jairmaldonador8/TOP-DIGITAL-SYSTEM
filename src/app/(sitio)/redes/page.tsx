import type { Metadata } from 'next'

import { Redes } from '@/components/sitio/secciones/redes'

export const metadata: Metadata = {
  title: 'Redes sociales',
  description:
    'Síguenos en Instagram, Facebook, TikTok, LinkedIn y YouTube: consejos prácticos y recomendaciones útiles para tu empresa. Suscríbete al newsletter.',
}

export default function PaginaRedes() {
  return (
    <div className="pt-24">
      <Redes />
    </div>
  )
}
