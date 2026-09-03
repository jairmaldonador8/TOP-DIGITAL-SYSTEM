import type { Metadata } from 'next'

import { Servicios } from '@/components/sitio/secciones/servicios'

export const metadata: Metadata = {
  title: 'Servicios',
  description:
    'Branding, páginas web, tiendas en línea, chatbots con IA, sistemas a la medida y campañas en Meta Ads. Todo lo que tu empresa necesita, en un solo equipo.',
}

export default function PaginaServicios() {
  return (
    <div className="pt-24">
      <Servicios
        titulo={
          <>
            Cada servicio resuelve
            <span className="text-marca"> un problema concreto.</span>
          </>
        }
      />
    </div>
  )
}
