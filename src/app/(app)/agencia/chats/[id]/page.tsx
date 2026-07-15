import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { enviarMensajeAgencia } from './actions'
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

export default async function PaginaChatCliente({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nombre_negocio, es_agencia')
    .eq('id', id)
    .maybeSingle()

  if (!cliente || cliente.es_agencia) notFound()

  const { data, error } = await supabase
    .from('mensajes')
    .select('id, autor_id, autor_nombre, texto, created_at')
    .eq('cliente_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) console.error('Error al cargar mensajes:', error)
  const mensajes = (data ?? []) as Mensaje[]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          href="/agencia/chats"
          className="flex size-9 items-center justify-center rounded-full bg-secondary outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Volver a chats"
        >
          <ArrowLeftIcon aria-hidden className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {cliente.nombre_negocio}
          </h1>
          <p className="text-xs text-muted-foreground">
            Conversación con el cliente
          </p>
        </div>
      </header>

      <Card className="gap-0 py-0">
        <CardContent className="max-h-[55svh] overflow-y-auto px-6 py-6">
          <HiloMensajes mensajes={mensajes} miId={miId} />
        </CardContent>
        <div className="border-t border-border px-4 py-3">
          <FormularioMensaje action={enviarMensajeAgencia.bind(null, id)} />
        </div>
      </Card>
    </div>
  )
}
