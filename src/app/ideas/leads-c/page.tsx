import { TableroLeads } from '@/components/sitio/secciones/tablero-leads'
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
 * OPCIÓN C del recibidor de leads: el sitio actual tal cual, con la
 * sección "Tablero" (sala de control a lo ancho, con ticker) bajo el hero.
 */
export default function LeadsC() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <Hero />
        <TableroLeads />
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
