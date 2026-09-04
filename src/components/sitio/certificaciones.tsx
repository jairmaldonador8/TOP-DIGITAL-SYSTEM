import Image from 'next/image'

import { CERTIFICACIONES } from '@/lib/sitio/contenido'

/**
 * Carrusel de certificaciones.
 *
 * El bucle se logra duplicando la lista y moviendo la pista un −50%. Ojo
 * con el espaciado: el hueco entre insignias va DENTRO de cada copia
 * (`pr-*` en el elemento), nunca como `gap` del contenedor — un `gap` no
 * entra en el translateX(-50%) y el bucle salta al reiniciar.
 *
 * Cada insignia es una placa BLANCA con el logotipo oficial a color: las
 * marcas de palabra de Meta, Shopify y Google traen texto oscuro y sobre
 * el fondo carbón del sitio desaparecerían. El nombre y el detalle no se
 * pintan (ya vienen dentro del logo) pero sí van en el `alt`, que es lo
 * que lee el lector de pantalla. Si a una certificación le falta `logo`,
 * cae a la versión tipográfica de siempre.
 */
function Insignia({
  nombre,
  detalle,
  logo,
}: {
  nombre: string
  detalle: string
  logo?: string
}) {
  if (logo) {
    return (
      <div className="pr-4">
        <div className="flex h-[4.5rem] w-56 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white px-6">
          <Image
            src={logo}
            alt={`${nombre} · ${detalle}`}
            width={176}
            height={44}
            className="h-11 w-auto max-w-full object-contain"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pr-4">
      <div className="flex h-[4.5rem] w-56 shrink-0 items-center gap-3.5 rounded-2xl border border-white/12 bg-white/[0.04] px-5">
        <span
          aria-hidden
          className="bg-marca flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
        >
          {nombre.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{nombre}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {detalle}
          </span>
        </span>
      </div>
    </div>
  )
}

export function CarruselCertificaciones() {
  // Se repite la lista hasta tener volumen suficiente para que la pista
  // llene el ancho aunque sean pocas certificaciones.
  const base = [...CERTIFICACIONES, ...CERTIFICACIONES]
  const pista = [...base, ...base]

  return (
    <div className="carrusel-cert relative mt-4 w-full max-w-full min-w-0 overflow-hidden">
      <style>{`
        @keyframes correr-cert { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pista-cert { animation: correr-cert 34s linear infinite; }
        .carrusel-cert:hover .pista-cert { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .pista-cert { animation: none; } }
      `}</style>

      {/* Difuminado en las orillas para que las insignias entren y salgan
          sin cortarse de golpe. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent"
      />

      <ul className="pista-cert flex w-max">
        {pista.map((c, i) => (
          <li
            key={`${c.nombre}-${i}`}
            // La segunda mitad es la copia que hace el bucle: para quien
            // usa lector de pantalla es ruido, no contenido.
            aria-hidden={i >= base.length}
          >
            <Insignia {...c} />
          </li>
        ))}
      </ul>
    </div>
  )
}
