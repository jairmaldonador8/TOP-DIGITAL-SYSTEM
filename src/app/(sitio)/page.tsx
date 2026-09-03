import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Hero } from '@/components/sitio/secciones/hero'
import { PanelLeads } from '@/components/sitio/secciones/panel-leads'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { RecibidorLeads } from '@/components/sitio/secciones/recibidor-leads'
import { Redes } from '@/components/sitio/secciones/redes'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'
import { TableroLeads } from '@/components/sitio/secciones/tablero-leads'

/**
 * Inicio del sitio público. El orden es el recorrido de venta acordado,
 * con las tres secciones animadas de la plataforma (aprobadas del taller
 * /ideas el 19-ago) repartidas para no encimarse:
 *
 *   promesa → EL PANEL (la prueba, recién hecha la promesa) → quiénes
 *   somos → prueba social → casos → tu problema y su solución → EL
 *   RECIBIDOR (así se siente resuelto) → servicios → EL TABLERO (así se
 *   controla lo que contrataste) → dudas → redes.
 *
 * Cada bloque cierra con el mismo CTA: agendar la videollamada.
 */
export default function Inicio() {
  return (
    <>
      <Hero />
      <PanelLeads />
      <QuienesSomos />
      <Servicios />
      <Casos />
      <RecibidorLeads />
      <TableroLeads />
      <Faq />
      <Resenas />
      <Redes />
    </>
  )
}
