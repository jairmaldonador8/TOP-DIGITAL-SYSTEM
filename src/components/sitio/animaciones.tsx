'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

/**
 * Utilidades de animación del taller de ideas. Todas respetan
 * prefers-reduced-motion: con movimiento reducido se muestra el estado
 * final sin animar.
 */

const CONSULTA_QUIETO = '(prefers-reduced-motion: reduce)'

export function usePrefiereQuieto() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(CONSULTA_QUIETO)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(CONSULTA_QUIETO).matches,
    // En el servidor se asume movimiento normal; el cliente corrige al montar.
    () => false
  )
}

/** true cuando el nodo entra en pantalla, una sola vez. */
export function useEnVista<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -60px 0px' }
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])
  return { ref, visible }
}

/**
 * Cifra que cuenta hacia `hasta` cuando `activo` pasa a true — y si
 * `hasta` cambia después (el latido en vivo), avanza SUAVE desde donde
 * iba, sin recontar desde cero. Con movimiento reducido pinta directo el
 * valor final.
 */
export function Contador({
  hasta,
  activo,
  prefijo = '',
  sufijo = '',
  duracion = 1400,
  className = '',
}: {
  hasta: number
  activo: boolean
  prefijo?: string
  sufijo?: string
  duracion?: number
  className?: string
}) {
  const quieto = usePrefiereQuieto()
  const [valor, setValor] = useState(0)
  // Último valor pintado: el punto de partida del siguiente conteo.
  const ultimo = useRef(0)

  useEffect(() => {
    if (!activo || quieto) return
    const desde = ultimo.current
    const delta = hasta - desde
    if (delta === 0) return
    // Los ticks chicos del latido (+1, +2) van rápido; la entrada, a su ritmo.
    const dur = Math.abs(delta) <= 4 ? 500 : duracion
    let marco = 0
    const inicio = performance.now()
    const pintar = (ahora: number) => {
      const t = Math.min((ahora - inicio) / dur, 1)
      const suave = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const v = Math.round(desde + delta * suave)
      ultimo.current = v
      setValor(v)
      if (t < 1) marco = requestAnimationFrame(pintar)
    }
    marco = requestAnimationFrame(pintar)
    return () => cancelAnimationFrame(marco)
  }, [activo, hasta, duracion, quieto])

  // Con movimiento reducido no se anima: el valor final se deriva directo.
  const mostrado = activo && quieto ? hasta : valor

  return (
    <span className={'tabular-nums ' + className}>
      {prefijo}
      {mostrado.toLocaleString('es-MX')}
      {sufijo}
    </span>
  )
}

/**
 * El reloj de las secciones vivas: cuenta latidos mientras `activo`.
 * Cada latido representa "cayó un lead" y todo lo que se mueve en la
 * sección se cuelga de él.
 */
export function useLatido(activo: boolean, periodoMs = 3900) {
  const [pulso, setPulso] = useState(0)
  useEffect(() => {
    if (!activo) return
    const reloj = setInterval(() => setPulso((p) => p + 1), periodoMs)
    return () => clearInterval(reloj)
  }, [activo, periodoMs])
  return pulso
}

/**
 * Curva viva: conserva la FORMA de `base` (la historia que cuenta, p. ej.
 * "esto sube") pero le suma una ondulación que se corre con cada latido,
 * interpolada con rAF casi todo el periodo — así la gráfica nunca está
 * quieta pero tampoco brinca. Con movimiento reducido devuelve el
 * objetivo directo (que en pulso constante es una curva quieta).
 */
export function useOnda(base: readonly number[], pulso: number, quieto: boolean) {
  const objetivo = useMemo(
    () =>
      base.map((v, k) => {
        const fase = pulso + k
        const onda = 5 * Math.sin(fase * 0.9) + 3 * Math.sin(fase * 2.1 + 1)
        return Math.min(98, Math.max(4, v + onda))
      }),
    [base, pulso]
  )
  const [visual, setVisual] = useState(objetivo)
  // Espejo del último cuadro pintado; solo se toca dentro de efectos/rAF.
  const espejo = useRef(objetivo)

  useEffect(() => {
    if (quieto) return
    const desde = [...espejo.current]
    const inicio = performance.now()
    let marco = 0
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / 3300, 1)
      const s = t * t * (3 - 2 * t) // easeInOut: deriva líquida, sin brincos
      const cuadro = objetivo.map((v, i) => desde[i] + (v - desde[i]) * s)
      espejo.current = cuadro
      setVisual(cuadro)
      if (t < 1) marco = requestAnimationFrame(paso)
    }
    marco = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(marco)
  }, [objetivo, quieto])

  return quieto ? objetivo : visual
}
