import { PanelCampanias } from '@/app/ideas/_piezas/panel'
import { BotonCta } from '@/components/sitio/cta'
import { FooterSitio } from '@/components/sitio/footer'
import { Topi } from '@/components/sitio/marca'
import { NavSitio } from '@/components/sitio/nav'
import { Casos } from '@/components/sitio/secciones/casos'
import { Faq } from '@/components/sitio/secciones/faq'
import { Problemas } from '@/components/sitio/secciones/problemas'
import { QuienesSomos } from '@/components/sitio/secciones/quienes-somos'
import { Redes } from '@/components/sitio/secciones/redes'
import { Resenas } from '@/components/sitio/secciones/resenas'
import { Servicios } from '@/components/sitio/secciones/servicios'
import { METRICAS } from '@/lib/sitio/contenido'

/**
 * IDEA "MIXTA" — el sitio actual, con el panel de la idea Consola.
 *
 * Todo lo de abajo del pliegue es EXACTAMENTE el sitio que ya existe:
 * mismas secciones, mismos componentes, mismo recorrido de venta. Lo único
 * que cambia es la portada, donde Topi cede la mitad derecha al panel de
 * campañas — la promesa deja de ser solo "conseguimos clientes" y pasa a
 * "y los vas a ver contarse". Topi no se va: se asoma por detrás del
 * panel, que es justo el gesto de la campaña.
 */
export default function IdeaMixta() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavSitio />
      <main className="flex-1">
        <HeroConPanel />
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

function HeroConPanel() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Misma atmósfera de marca del sitio actual: los tres tonos del
          degradado, muy difuminados, sobre la trama de puntos. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-marca-violeta/20 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 -right-40 size-[30rem] rounded-full bg-marca-magenta/15 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-40 h-96 bg-gradient-to-t from-marca-naranja/20 via-marca-magenta/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(244,241,247,0.05)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.02fr] lg:gap-12">
        <div>
          <p className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-1.5 pr-4 pl-2 text-xs font-medium text-muted-foreground backdrop-blur duration-700">
            <span className="bg-marca size-2 rounded-full" aria-hidden />
            Agencia de marketing, marca y tecnología
          </p>

          <h1 className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both font-heading mt-7 text-[2.6rem] leading-[0.98] font-extrabold tracking-tight text-balance delay-75 duration-700 sm:text-6xl lg:text-[4.2rem]">
            Somos resultados <span className="text-marca">TOP</span>
            <br />
            en lo <span className="text-marca">DIGITAL</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both mt-7 max-w-xl text-base leading-relaxed text-muted-foreground delay-150 duration-700 sm:text-lg">
            Marca, sitio, campañas y tecnología trabajando juntos para que tu
            empresa consiga clientes mes tras mes — y una plataforma donde los
            ves llegar en vivo, sin esperar al reporte del lunes.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both mt-10 flex flex-col items-start gap-4 delay-200 duration-700 sm:flex-row sm:items-center">
            <BotonCta />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                aria-hidden
                className="relative flex size-2 items-center justify-center"
              >
                <span className="absolute size-2 animate-ping rounded-full bg-marca-magenta/70" />
                <span className="size-2 rounded-full bg-marca-magenta" />
              </span>
              Solo 1 cliente al mes en servicio premium
            </p>
          </div>

          <dl className="animate-in fade-in fill-mode-both mt-14 grid grid-cols-2 gap-x-8 gap-y-7 delay-300 duration-1000 sm:grid-cols-4">
            {METRICAS.map(({ cifra, unidad, etiqueta }) => (
              <div key={etiqueta}>
                <dt className="sr-only">{etiqueta}</dt>
                <dd>
                  <span className="font-heading block text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {cifra}
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                      {unidad}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.8rem] leading-snug text-muted-foreground">
                    {etiqueta}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* El panel manda y Topi se asoma detrás: se conserva el personaje
            sin que le quite protagonismo a lo que se está demostrando. */}
        <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both relative delay-300 duration-1000">
          <Topi
            decorativo
            pose="parado"
            className="pointer-events-none absolute -top-28 right-8 hidden w-36 rotate-6 drop-shadow-[0_20px_60px_rgba(124,58,237,0.45)] lg:block"
          />
          <PanelCampanias radio="suave" className="relative" />
          <p className="relative mt-4 text-center font-mono text-[0.62rem] tracking-[0.22em] text-muted-foreground uppercase">
            Tu panel, desde el primer mes
          </p>
        </div>
      </div>
    </section>
  )
}
