import { BajarAlPanel } from '@/components/sitio/bajar-al-panel'
import { BotonCta } from '@/components/sitio/cta'
import { METRICAS } from '@/lib/sitio/contenido'

/**
 * Portada del sitio. Todo centrado sobre el eje: la promesa de la marca en
 * grande, las cifras que la sostienen y, al pie, Topi chiquito señalando
 * hacia la primera animación — el visitante baja de la promesa a la prueba
 * sin tener que buscar dónde seguir.
 *
 * Sin atmósfera: el fondo carbón corre parejo por todo el sitio y el color
 * lo pone solo la marca. Los halos difuminados que había aquí teñían esta
 * zona y dejaban una costura visible al bajar al panel.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
      <div className="relative mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
        <p className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-1.5 pr-4 pl-2 text-xs font-medium text-muted-foreground backdrop-blur duration-700">
          <span className="bg-marca size-2 rounded-full" aria-hidden />
          Agencia de marketing, marca y tecnología
        </p>

        <h1 className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both font-heading mt-6 text-[2.7rem] leading-[0.98] font-extrabold tracking-tight text-balance delay-75 duration-700 sm:text-6xl lg:text-7xl">
          Somos resultados <span className="text-marca">TOP</span>
          <br />
          en lo <span className="text-marca">DIGITAL</span>
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both mx-auto mt-6 max-w-2xl text-base leading-relaxed text-balance text-muted-foreground delay-150 duration-700 sm:text-lg">
          Marca, sitio, campañas y tecnología trabajando juntos para que tu
          empresa consiga clientes mes tras mes. Te decimos qué te está
          frenando en una videollamada, sin costo y sin compromiso.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both mt-9 flex flex-col items-center gap-4 delay-200 duration-700 sm:flex-row sm:justify-center">
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

        <dl className="animate-in fade-in fill-mode-both mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-7 delay-300 duration-1000 sm:grid-cols-4">
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

        {/* Topi chiquito al pie: recibe y de paso manda al panel en vivo. */}
        <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both delay-500 duration-1000">
          <BajarAlPanel />
        </div>
      </div>
    </section>
  )
}
