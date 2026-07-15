import type { Metadata } from 'next'
import { ChartColumn } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function PaginaPortal() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('user_id', data?.claims?.sub ?? '')
    .maybeSingle()

  const nombre: string = usuario?.nombre ?? 'Cliente'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hola, {nombre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenido al portal de tu negocio.
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
              Aquí verás el desempeño de tus campañas y tus leads más
              recientes en cuanto estén disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
