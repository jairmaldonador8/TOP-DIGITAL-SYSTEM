'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PasoTour = {
  /** Selector del elemento a resaltar; null = tarjeta centrada (bienvenida). */
  selector: string | null
  titulo: string
  texto: string
  redondo?: boolean
}

const MARGEN = 8
const ANCHO_BURBUJA = 300
const ALTO_BURBUJA = 220

type Posicion = {
  resalte: React.CSSProperties
  burbuja: React.CSSProperties
}

function calcularPosicion(paso: PasoTour): Posicion {
  const objetivo = paso.selector
    ? document.querySelector(paso.selector)
    : null

  if (!objetivo) {
    // Bienvenida (o elemento ausente): burbuja centrada sin recorte.
    return {
      resalte: { top: '50%', left: '50%', width: 0, height: 0, outline: 'none' },
      burbuja: {
        top: `calc(50% - ${ALTO_BURBUJA / 2}px)`,
        left: `calc(50% - ${ANCHO_BURBUJA / 2}px)`,
      },
    }
  }

  const caja = objetivo.getBoundingClientRect()
  const cabeAbajo = caja.bottom + ALTO_BURBUJA + 40 < window.innerHeight
  return {
    resalte: {
      top: caja.top - MARGEN,
      left: caja.left - MARGEN,
      width: caja.width + MARGEN * 2,
      height: caja.height + MARGEN * 2,
      borderRadius: paso.redondo ? 9999 : 16,
    },
    burbuja: {
      top: cabeAbajo ? caja.bottom + 22 : Math.max(16, caja.top - ALTO_BURBUJA),
      left: Math.max(
        16,
        Math.min(
          window.innerWidth - ANCHO_BURBUJA - 16,
          caja.left + caja.width / 2 - ANCHO_BURBUJA / 2
        )
      ),
    },
  }
}

/**
 * Motor del tour de bienvenida: oscurece la pantalla y resalta los elementos
 * reales uno por uno. Cada zona define sus pasos; al terminar (o saltar) se
 * invoca `action` (marca intro_vista) y no vuelve a salir.
 */
export function Tour({
  pasos: pasosDefinidos,
  action,
}: {
  pasos: PasoTour[]
  action: () => Promise<void>
}) {
  // Los pasos cuyo elemento no está visible (p. ej. nav o avatar en móvil)
  // se descartan al montar, para no señalar al vacío.
  const [pasos, setPasos] = React.useState<PasoTour[] | null>(null)
  const [indice, setIndice] = React.useState(0)
  const [posicion, setPosicion] = React.useState<Posicion | null>(null)
  const [terminado, setTerminado] = React.useState(false)

  React.useEffect(() => {
    // Un frame después de hidratar, cuando el layout ya está pintado.
    const id = requestAnimationFrame(() => {
      setPasos(
        pasosDefinidos.filter(
          (paso) =>
            paso.selector === null ||
            (document.querySelector(paso.selector)?.getClientRects().length ??
              0) > 0
        )
      )
    })
    return () => cancelAnimationFrame(id)
  }, [pasosDefinidos])

  const paso = pasos?.[indice]

  React.useEffect(() => {
    if (!paso) return
    const reposicionar = () => setPosicion(calcularPosicion(paso))
    reposicionar()
    window.addEventListener('resize', reposicionar)
    return () => window.removeEventListener('resize', reposicionar)
  }, [paso])

  // Sin scroll de fondo mientras dura el tour.
  React.useEffect(() => {
    if (terminado) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [terminado])

  const terminar = React.useCallback(() => {
    setTerminado(true)
    // Persistir en segundo plano; el tour ya se ocultó de forma optimista.
    void action()
  }, [action])

  React.useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') terminar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [terminar])

  if (terminado || !pasos || !paso || !posicion) return null

  const esUltimo = indice === pasos.length - 1

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Tour de bienvenida">
      {/* Recorte: la sombra gigante oscurece todo menos el elemento del paso. */}
      <div
        aria-hidden
        className="absolute rounded-2xl outline-2 outline-offset-4 outline-marca-magenta transition-all duration-300 ease-out"
        style={{
          ...posicion.resalte,
          boxShadow: '0 0 0 9999px rgba(8, 6, 12, 0.82)',
        }}
      />

      <div
        className="absolute w-[300px] rounded-2xl border border-border bg-card p-5 shadow-2xl transition-all duration-300 ease-out"
        style={posicion.burbuja}
      >
        <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
          Paso {indice + 1} de {pasos.length}
        </p>
        <h2 className="mt-1.5 text-[15px] font-semibold">{paso.titulo}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {paso.texto}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div aria-hidden className="flex gap-1.5">
            {pasos.map((_, punto) => (
              <span
                key={punto}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  punto === indice ? 'bg-marca w-4' : 'w-1.5 bg-border'
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={terminar}
            >
              Saltar
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-marca border-0 text-white"
              onClick={() => (esUltimo ? terminar() : setIndice(indice + 1))}
            >
              {esUltimo ? '¡Entendido!' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
