import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * Piezas de marca de la plataforma (identidad de ago-2026, la misma del
 * sitio web). Los SVG viven en /public/marca con el color horneado: como
 * <img> no heredan `currentColor`, así que el wordmark es blanco y solo va
 * sobre fondos oscuros — la plataforma lo es en todas sus pantallas.
 */

/** Cabeza de Topi en blanco sobre el degradado de marca. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/isotipo.svg"
      alt=""
      aria-hidden
      width={512}
      height={512}
      priority
      className={cn('shrink-0 rounded-[28%]', className)}
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/wordmark.svg"
      alt="Top Digital"
      width={1270}
      height={299}
      priority
      className={cn('h-auto', className)}
    />
  )
}
