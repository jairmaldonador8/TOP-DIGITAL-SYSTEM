import type { Metadata } from 'next'

import { Casos } from '@/components/sitio/secciones/casos'
import { Resenas } from '@/components/sitio/secciones/resenas'

export const metadata: Metadata = {
  title: 'Casos de éxito',
  description:
    'Negocios reales que crecieron con Top Digital: el reto con el que llegaron, lo que hicimos y los resultados que obtuvieron.',
}

export default function PaginaCasos() {
  return (
    <div className="pt-24">
      <Casos />
      <Resenas />
    </div>
  )
}
