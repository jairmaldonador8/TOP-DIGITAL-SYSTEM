import Image from 'next/image'
import { Camera } from 'lucide-react'

/**
 * Marco de imagen del sitio. Mientras no exista la foto real del cliente
 * muestra un hueco marcado con lo que debe ir ahí — así el sitio se puede
 * revisar completo sin publicar imágenes de relleno que parezcan reales.
 */
export function Foto({
  src,
  alt,
  pie,
  className = '',
  ratio = 'aspect-[4/3]',
}: {
  src?: string
  alt: string
  /** Qué foto va aquí; se muestra dentro del hueco cuando falta la imagen. */
  pie: string
  className?: string
  ratio?: string
}) {
  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/10 ${ratio} ${className}`}
      >
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center ${ratio} ${className}`}
    >
      <Camera aria-hidden className="size-7 text-muted-foreground" />
      <p className="max-w-[22ch] text-xs leading-relaxed text-muted-foreground">
        {pie}
      </p>
    </div>
  )
}
