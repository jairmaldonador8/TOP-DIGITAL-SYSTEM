import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRightIcon, MessagesSquareIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { formatoFechaHora } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Chats',
}

type FilaCliente = { id: string; nombre_negocio: string }
type FilaMensaje = {
  cliente_id: string
  autor_id: string | null
  texto: string
  leido: boolean
  created_at: string
}

export default async function PaginaChats() {
  const supabase = await createClient()
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null

  const [clientes, mensajes] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('es_agencia', false)
      .order('nombre_negocio'),
    supabase
      .from('mensajes')
      .select('cliente_id, autor_id, texto, leido, created_at')
      .order('created_at', { ascending: false })
      .limit(300),
  ])

  if (clientes.error) console.error('Error al cargar chats:', clientes.error)
  const lista = (clientes.data ?? []) as FilaCliente[]

  // Último mensaje y no leídos por cliente (la consulta viene descendente).
  const ultimoPor = new Map<string, FilaMensaje>()
  const noLeidosPor = new Map<string, number>()
  for (const mensaje of (mensajes.data ?? []) as FilaMensaje[]) {
    if (!ultimoPor.has(mensaje.cliente_id)) {
      ultimoPor.set(mensaje.cliente_id, mensaje)
    }
    if (!mensaje.leido && mensaje.autor_id !== miId) {
      noLeidosPor.set(
        mensaje.cliente_id,
        (noLeidosPor.get(mensaje.cliente_id) ?? 0) + 1
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversaciones con tus clientes.
        </p>
      </header>

      {clientes.error ? (
        <Card className="items-center py-10 text-center">
          <p className="max-w-sm text-sm text-destructive" role="alert">
            No se pudieron cargar los chats. Recarga la página para
            intentarlo de nuevo.
          </p>
        </Card>
      ) : lista.length === 0 ? (
        <Card className="items-center gap-4 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <MessagesSquareIcon
              aria-hidden
              className="size-5 text-marca-magenta"
            />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Sin conversaciones</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Cuando registres clientes podrás chatear con ellos aquí.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2">
            <ul className="flex flex-col">
              {lista.map((cliente) => {
                const ultimo = ultimoPor.get(cliente.id)
                const noLeidos = noLeidosPor.get(cliente.id) ?? 0
                return (
                  <li key={cliente.id}>
                    <Link
                      href={`/agencia/chats/${cliente.id}`}
                      className="flex items-center gap-4 rounded-xl px-4 py-3.5 outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span
                        aria-hidden
                        className="bg-marca flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      >
                        {cliente.nombre_negocio.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {cliente.nombre_negocio}
                        </span>
                        <span
                          className={cn(
                            'block truncate text-sm',
                            noLeidos > 0
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {ultimo?.texto ?? 'Sin mensajes todavía'}
                        </span>
                      </span>
                      {noLeidos > 0 ? (
                        <span className="bg-marca flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white">
                          {noLeidos > 9 ? '9+' : noLeidos}
                        </span>
                      ) : null}
                      {ultimo ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatoFechaHora(ultimo.created_at)}
                        </span>
                      ) : null}
                      <ChevronRightIcon
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
