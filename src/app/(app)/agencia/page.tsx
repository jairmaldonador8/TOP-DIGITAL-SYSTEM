import type { Metadata } from 'next'
import { ChartColumn } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function PaginaAgencia() {
  const actual = await usuarioActual()
  const nombre = actual.nombre ?? 'Equipo Top Digital'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hola, {nombre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Este es el panel general de la agencia.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-sidebar">
            <ChartColumn aria-hidden className="size-5 text-accent-lima" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Dashboard — próximamente
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Aquí verás los indicadores clave de tus clientes, campañas y
              leads en cuanto estén disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
