'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * En el servidor no hay layout que medir; useLayoutEffect avisaría por
 * consola, así que ahí cae a useEffect.
 */
const useEfectoDeLayout =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

type Estado = 'sin-js' | 'oculto' | 'visible'

/**
 * Entrada al hacer scroll: el bloque aparece subiendo cuando entra en
 * pantalla, una sola vez.
 *
 * Arranca VISIBLE a propósito. El bloque solo se oculta cuando el cliente
 * ya montó, confirmó que hay movimiento permitido y midió que está fuera
 * de pantalla — así, si el JS falla o tarda, el contenido nunca se queda
 * en blanco, y como se esconde antes de pintar no hay parpadeo.
 */
export function Revelar({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<Estado>('sin-js')

  useEfectoDeLayout(() => {
    const nodo = ref.current
    if (!nodo) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEstado('visible')
      return
    }

    // Lo que ya se ve al cargar se queda como está: animarlo obligaría a
    // esconder algo que el visitante ya tiene enfrente.
    const caja = nodo.getBoundingClientRect()
    if (caja.top < window.innerHeight) {
      setEstado('visible')
      return
    }

    setEstado('oculto')
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setEstado('visible')
          observador.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  const animacion =
    estado === 'oculto'
      ? 'translate-y-6 opacity-0'
      : estado === 'visible'
        ? 'translate-y-0 opacity-100'
        : ''

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${animacion} ${className}`}
    >
      {children}
    </div>
  )
}
