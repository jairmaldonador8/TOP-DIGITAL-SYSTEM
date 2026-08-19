import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Hero } from '@/components/sitio/secciones/hero'
import { Problemas } from '@/components/sitio/secciones/problemas'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { Redes } from '@/components/sitio/secciones/redes'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'

/**
 * Inicio del sitio público. El orden es el recorrido de venta acordado:
 * promesa → quiénes somos → prueba social → casos → tu problema y su
 * solución → servicios → dudas → redes. Cada bloque cierra con el mismo
 * CTA: agendar la videollamada de diagnóstico.
 */
export default function Inicio() {
  return (
    <>
      <Hero />
      <QuienesSomos />
      <Resenas />
      <Casos />
      <Problemas />
      <Servicios />
      <Faq />
      <Redes />
    </>
  )
}
