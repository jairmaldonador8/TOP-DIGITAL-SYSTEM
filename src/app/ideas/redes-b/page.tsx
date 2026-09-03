import { RedesPerfiles } from '@/app/ideas/_piezas/redes-perfiles'
import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'
import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Hero } from '@/components/sitio/secciones/hero'
import { PanelLeads } from '@/components/sitio/secciones/panel-leads'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { RecibidorLeads } from '@/components/sitio/secciones/recibidor-leads'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'
import { TableroLeads } from '@/components/sitio/secciones/tablero-leads'

/** OPCIÓN B · Perfiles para la sección de redes, en el contexto del sitio real. */
export default function RedesOpcion() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <Hero />
        <PanelLeads />
        <QuienesSomos />
        <Servicios />
        <Casos />
        <RecibidorLeads />
        <TableroLeads />
        <Faq />
        <Resenas />
        <RedesPerfiles />
      </main>
      <FooterSitio />
    </div>
  )
}
