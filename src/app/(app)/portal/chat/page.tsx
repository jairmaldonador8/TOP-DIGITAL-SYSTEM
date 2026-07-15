import type { Metadata } from 'next'

import { enviarMensajePortal } from './actions'
import {
  FormularioMensaje,
  HiloMensajes,
  type Mensaje,
} from '@/components/chat/hilo'
import { Card, CardContent } from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Chat',
}

export default async function PaginaChatPortal() {
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  const supabase = await createClient()

  // La RLS limita la consulta a los mensajes del cliente de la sesión.
  const { data, error } = await supabase
    .from('mensajes')
    .select('id, autor_id, autor_nombre, texto, created_at')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) console.error('Error al cargar mensajes del portal:', error)
  const mensajes = (data ?? []) as Mensaje[]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Habla directo con el equipo de Top Digital.
        </p>
      </header>

      <Card className="gap-0 py-0">
        <CardContent className="max-h-[55svh] overflow-y-auto px-6 py-6">
          <HiloMensajes mensajes={mensajes} miId={miId} />
        </CardContent>
        <div className="border-t border-border px-4 py-3">
          <FormularioMensaje action={enviarMensajePortal} />
        </div>
      </Card>
    </div>
  )
}
