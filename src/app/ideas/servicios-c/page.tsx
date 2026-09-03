import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'
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
 * OPCIÓN C · Vitrina — la elegida. Ya no vive aquí: se graduó a
 * `components/sitio/secciones/servicios.tsx` y esta página solo la
 * muestra en contexto, igual que el sitio real, para poder compararla
 * contra las opciones A y B.
 */
export default function ServiciosOpcionC() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <Hero />
        <PanelLeads />
        <QuienesSomos />
        <Resenas />
        <Casos />
        <Servicios />
        <RecibidorLeads />
        <TableroLeads />
        <Faq />
        <Redes />
      </main>
      <FooterSitio />
    </div>
  )
}
