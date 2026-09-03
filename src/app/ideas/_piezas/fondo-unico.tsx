import { FooterSitio } from '@/components/sitio/footer'
import { NavSitio } from '@/components/sitio/nav'
import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Hero } from '@/components/sitio/secciones/hero'
import { PanelLeads } from '@/components/sitio/secciones/panel-leads'
import { Problemas } from '@/components/sitio/secciones/problemas'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { RecibidorLeads } from '@/components/sitio/secciones/recibidor-leads'
import { Redes } from '@/components/sitio/secciones/redes'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'
import { TableroLeads } from '@/components/sitio/secciones/tablero-leads'

/**
 * El sitio completo sobre UN SOLO color de fondo, de arriba a abajo.
 *
 * Hoy el fondo cambia tres veces sin querer: los halos de color del hero
 * y de Problemas lo tiñen por zonas, y el pie usa un negro distinto
 * (#050505) al del resto (#0d0b10) — de ahí la línea horizontal que se
 * ve al bajar del hero.
 *
 * Aquí se apagan las tres fuentes a la vez, sin duplicar componentes:
 *   · `.atmosfera` marca los halos decorativos del sitio y se ocultan;
 *   · el pie y las secciones se vuelven transparentes para heredar;
 *   · `--background` se reescribe para que la nav y el resto del sistema
 *     de color usen el mismo tono.
 *
 * Las tarjetas conservan su `bg-white/[0.03]`: son piezas SOBRE el fondo,
 * no el fondo, y son las que dan profundidad ahora que no hay halos.
 */
export function SitioConFondo({ color }: { color: string }) {
  return (
    <div
      className="fondo-unico flex min-h-svh flex-col"
      style={
        { backgroundColor: color, '--background': color } as React.CSSProperties
      }
    >
      <style>{`
        .fondo-unico .atmosfera { display: none !important; }
        .fondo-unico section,
        .fondo-unico footer { background-color: transparent !important; }
      `}</style>

      <NavSitio />
      <main className="flex-1">
        <Hero />
        <PanelLeads />
        <QuienesSomos />
        <Resenas />
        <Casos />
        <Problemas />
        <RecibidorLeads />
        <Servicios />
        <TableroLeads />
        <Faq />
        <Redes />
      </main>
      <FooterSitio />
    </div>
  )
}
