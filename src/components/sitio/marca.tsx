import Image from 'next/image'

/**
 * Piezas de marca del sitio público. Los SVG viven en /public/marca con el
 * BLANCO horneado en el archivo: al servirse como <img> no heredan
 * `currentColor` de la página, así que el color tiene que venir dentro. El
 * sitio es oscuro en todas sus secciones; una versión sobre fondo claro
 * necesitaría su propio archivo (ver el paquete de descargables de marca).
 * El "somos" del lockup conserva su degradado propio: es la firma oficial.
 */

export function Lockup({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/marca/lockup-somos.svg"
      alt="Somos Top Digital"
      width={1270}
      height={358}
      priority
      className={className}
    />
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/marca/wordmark.svg"
      alt="Top Digital"
      width={1270}
      height={299}
      className={className}
    />
  )
}

type TopiProps = {
  pose?: 'saluda' | 'parado'
  className?: string
  /** Decorativo: se oculta a lectores de pantalla. */
  decorativo?: boolean
}

export function Topi({ pose = 'saluda', className = '', decorativo }: TopiProps) {
  const src = pose === 'parado' ? '/marca/topi-parado.svg' : '/marca/topi-saluda.svg'
  return (
    <Image
      src={src}
      alt={decorativo ? '' : 'Topi, la mascota de Top Digital'}
      aria-hidden={decorativo || undefined}
      width={470}
      height={742}
      className={className}
    />
  )
}

/**
 * Firma del estudio que hizo la identidad y el sitio. No es marca de Top
 * Digital: es el logotipo de VITAstudio, en blanco sobre transparente
 * porque el pie del sitio siempre es oscuro. El trazo es de línea muy fina,
 * así que se muestra a un tamaño donde todavía se lee.
 */
export function FirmaEstudio({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/marca/vitastudio.png"
      alt="VITAstudio"
      width={1200}
      height={275}
      className={className}
    />
  )
}
