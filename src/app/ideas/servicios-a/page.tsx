import { ServiciosIndice } from '@/app/ideas/_piezas/servicios-indice'
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
import { TableroLeads } from '@/components/sitio/secciones/tablero-leads'

/**
 * OPCIÓN A · Índice para presentar los servicios: los siete servicios como un índice editorial, sin portadas, con el departamento externo cerrando como estrella.
 *
 * El resto del inicio va con el orden nuevo (sin la sección de problemas
 * y con los servicios ya en su lugar), para poder compararlas en contexto.
 */
export default function ServiciosOpcion() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <Hero />
        <PanelLeads />
        <QuienesSomos />
        <Resenas />
        <Casos />
        <ServiciosIndice />
        <RecibidorLeads />
        <TableroLeads />
        <Faq />
        <Redes />
      </main>
      <FooterSitio />
    </div>
  )
}
