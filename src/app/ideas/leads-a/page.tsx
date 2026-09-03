import { PanelLeads } from '@/components/sitio/secciones/panel-leads'
import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'
import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Hero } from '@/components/sitio/secciones/hero'
import { Problemas } from '@/components/sitio/secciones/problemas'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { Redes } from '@/components/sitio/secciones/redes'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'

/**
 * OPCIÓN A del recibidor de leads: el sitio actual tal cual, con la
 * sección "Panel" (la captura aprobada, animada) justo debajo del hero.
 */
export default function LeadsA() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <Hero />
        <PanelLeads />
        <QuienesSomos />
        <Resenas />
        <Casos />
        <Problemas />
        <Servicios />
        <Faq />
        <Redes />
      </main>
      <FooterSitio />
    </div>
  )
}
