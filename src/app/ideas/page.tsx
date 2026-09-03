import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Lockup } from '@/components/sitio/marca'

/**
 * Portada del taller: las direcciones visuales que estamos comparando,
 * con lo que apuesta cada una. El sitio publicado no cambia — todo esto
 * vive aparte hasta que se elija una.
 */
/**
 * Segunda ronda del taller (19-ago): tres opciones para la sección del
 * recibidor de leads, insertada bajo el hero del sitio actual.
 */
const FONDOS = [
  {
    href: '/ideas/fondo-negro',
    nombre: 'Negro puro',
    apuesta: '#000000',
    resumen:
      'Sin ningún tinte. El degradado de marca y las cifras blancas quedan al máximo contraste, y las tarjetas se despegan clarísimo del fondo. El más rotundo de los tres.',
    tonos: ['#000000', '#000000', '#000000'],
  },
  {
    href: '/ideas/fondo-tinta',
    nombre: 'Tinta',
    apuesta: '#0d0b10',
    resumen:
      'El casi-negro con tinte violeta que ya usa el sistema de color del proyecto, ahora parejo en todo el sitio. El más cercano a lo actual: conserva la calidez de marca, sin manchas ni costura.',
    tonos: ['#0d0b10', '#0d0b10', '#0d0b10'],
  },
  {
    href: '/ideas/fondo-carbon',
    nombre: 'Carbón',
    apuesta: '#0a0a0c',
    resumen:
      'Negro neutro, sin tinte. Es el tono exacto de los paneles de la plataforma, así que las maquetas dejan de flotar sobre el fondo y se leen como parte de la misma pieza.',
    tonos: ['#0a0a0c', '#0a0a0c', '#0a0a0c'],
  },
]

const OPCIONES_LEADS = [
  {
    href: '/ideas/leads-vivo',
    nombre: 'Leads Vivo · Siempre encendidos',
    apuesta: 'Nunca se detiene, estilo Shopify',
    resumen:
      'Un latido cada 4 segundos: cae un lead a la bandeja, el contador sube con un pop, la curva se desliza un paso y las campañas avanzan — sin parar. El marco además se inclina y brilla siguiendo el cursor.',
    tonos: ['#0a0a0c', '#f0338d', '#fca044'],
  },
  {
    href: '/ideas/leads-a',
    nombre: 'Leads A · Panel',
    apuesta: 'La captura aprobada, viva',
    resumen:
      'El panel de campañas de la captura, animado: la cifra cuenta hasta 252, la curva se dibuja sola, las barras se llenan en cascada. A la izquierda, el argumento y el CTA.',
    tonos: ['#0a0a0c', '#f0338d', '#34d399'],
  },
  {
    href: '/ideas/leads-b',
    nombre: 'Leads B · Recibidor',
    apuesta: 'Los leads cayendo en vivo',
    resumen:
      'Una bandeja de entrada que recibe leads uno por uno — nombre, qué busca, de qué campaña vino — mientras el contador grande sube con cada llegada. El momento que el cliente quiere vivir.',
    tonos: ['#0a0a0c', '#7c3aed', '#34d399'],
  },
  {
    href: '/ideas/leads-c',
    nombre: 'Leads C · Tablero',
    apuesta: 'Sala de control a lo ancho',
    resumen:
      'Un tablero de borde a borde: tres KPIs que cuentan hacia arriba, la curva del mes en grande con rejilla, las campañas al lado y un ticker corriendo con los leads que entran.',
    tonos: ['#0a0a0c', '#fca044', '#34d399'],
  },
]

const IDEAS = [
  {
    href: '/ideas/mixta',
    nombre: 'Mixta',
    apuesta: 'El sitio actual, con panel',
    resumen:
      'El sitio que ya existe tal cual — mismas secciones, mismo recorrido — pero en la portada Topi le cede la mitad derecha al panel de campañas de la idea Consola. La promesa deja de ser solo conseguir clientes y pasa a verlos contarse en vivo.',
    tonos: ['#0d0b10', '#f0338d', '#34d399'],
  },
  {
    href: '/ideas/papel',
    nombre: 'Papel',
    apuesta: 'Estudio con criterio',
    resumen:
      'Fondo claro, serif de alto contraste y mucho aire. El degradado se vuelve tinta cara: aparece contadas veces. Se ve caro y calmado; compite con despachos, no con agencias de anuncios.',
    tonos: ['#efebe3', '#17141c', '#f0338d'],
  },
  {
    href: '/ideas/bloques',
    nombre: 'Bloques',
    apuesta: 'Cartel que no se olvida',
    resumen:
      'El degradado se rompe en sus tres tonos y cada uno toma una franja completa. Bordes negros, mayúsculas apretadas, Topi entrando por la orilla. Ruidoso a propósito.',
    tonos: ['#7c3aed', '#f0338d', '#fca044'],
  },
  {
    href: '/ideas/consola',
    nombre: 'Consola',
    apuesta: 'La plataforma es el argumento',
    resumen:
      'Negro puro, rejilla de precisión y el degradado convertido en luz. La portada enseña el panel de campañas real: deja de prometer marketing y empieza a prometer control.',
    tonos: ['#000000', '#7c3aed', '#fca044'],
  },
]

export default function TallerIdeas() {
  return (
    <div className="min-h-svh bg-[#0d0b10] px-5 pt-16 pb-32 text-white lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Lockup className="h-9 w-auto" />
        <p className="mt-10 font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
          Taller · direcciones visuales
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
          Tres formas distintas de que se vea el mismo sitio
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-white/60">
          Mismo contenido, misma marca, mismos textos. Lo único que cambia es la
          dirección de arte. El sitio actual sigue intacto — esto es material de
          taller para decidir.
        </p>

        <h2 className="mt-14 font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
          Ronda 3 · Un solo color de fondo, de arriba a abajo
        </h2>
        <div className="mt-5 grid gap-5">
          {FONDOS.map((idea) => (
            <Tarjeta key={idea.href} idea={idea} />
          ))}
        </div>

        <h2 className="mt-14 font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
          Ronda 2 · El recibidor de leads, bajo el hero del sitio actual
        </h2>
        <div className="mt-5 grid gap-5">
          {OPCIONES_LEADS.map((idea) => (
            <Tarjeta key={idea.href} idea={idea} />
          ))}
        </div>

        <h2 className="mt-14 font-mono text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
          Ronda 1 · Direcciones de arte completas
        </h2>
        <div className="mt-5 grid gap-5">
          {IDEAS.map((idea) => (
            <Tarjeta key={idea.href} idea={idea} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Tarjeta({ idea }: { idea: (typeof IDEAS)[number] }) {
  return (
    <Link
      href={idea.href}
      className="group grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-white/25 hover:bg-white/[0.06] sm:grid-cols-[auto_1fr_auto] sm:items-center"
    >
      <div className="flex gap-1.5" aria-hidden>
        {idea.tonos.map((t) => (
          <span
            key={t}
            className="size-9 rounded-lg border border-white/15"
            style={{ backgroundColor: t }}
          />
        ))}
      </div>
      <div>
        <h3 className="text-xl font-bold">
          {idea.nombre}
          <span className="ml-3 font-mono text-[0.62rem] tracking-[0.18em] text-white/40 uppercase">
            {idea.apuesta}
          </span>
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          {idea.resumen}
        </p>
      </div>
      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white"
      />
    </Link>
  )
}
