import { BotonCta } from '@/components/sitio/cta'
import { Topi } from '@/components/sitio/marca'
import { METRICAS } from '@/lib/sitio/contenido'

/**
 * Portada del sitio. La promesa de la marca en grande, Topi asomándose
 * desde el borde como en los banners de la campaña, y la barra de cifras
 * que sostiene la promesa antes de que el visitante haga scroll.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Atmósfera de marca: los tres tonos del degradado, muy difuminados. */}
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

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-1.5 pr-4 pl-2 text-xs font-medium text-muted-foreground backdrop-blur duration-700">
            <span className="bg-marca size-2 rounded-full" aria-hidden />
            Agencia de marketing, marca y tecnología
          </p>

          <h1 className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both font-heading mt-7 text-[2.6rem] leading-[0.98] font-extrabold tracking-tight text-balance delay-75 duration-700 sm:text-6xl lg:text-7xl">
            Somos resultados <span className="text-marca">TOP</span>
            <br />
            en lo <span className="text-marca">DIGITAL</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both mt-7 max-w-xl text-base leading-relaxed text-muted-foreground delay-150 duration-700 sm:text-lg">
            Marca, sitio, campañas y tecnología trabajando juntos para que tu
            empresa consiga clientes mes tras mes. Te decimos qué te está
            frenando en una videollamada, sin costo y sin compromiso.
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

        {/* Topi saludando: el personaje de la marca recibe al visitante. */}
        <div
          aria-hidden
          className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both relative hidden justify-center delay-300 duration-1000 lg:flex"
        >
          <div
            className="absolute inset-0 m-auto size-72 rounded-full bg-marca-violeta/25 blur-[90px]"
            aria-hidden
          />
          <Topi
            decorativo
            className="relative w-full max-w-[19rem] rotate-[-6deg] text-white drop-shadow-[0_20px_60px_rgba(124,58,237,0.35)]"
          />
        </div>
      </div>
    </section>
  )
}
