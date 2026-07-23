'use client'

import * as React from 'react'
import { CheckIcon, InboxIcon, UndoIcon } from 'lucide-react'
import { toast } from 'sonner'

import { revisarEncargo } from '@/app/(app)/agencia/equipo/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatoFechaHora } from '@/lib/formato'

export type EntregaView = {
  id: string
  titulo: string
  descripcion: string | null
  trabajador: string
  cliente: string | null
  entregadoEn: string | null
}

/**
 * Bandeja "Por revisar" del dueño: encargos entregados con aprobar de un
 * toque o pedir cambios con comentario obligatorio (dialog).
 */
export function BandejaRevision({ entregas }: { entregas: EntregaView[] }) {
  const [pidiendo, setPidiendo] = React.useState<EntregaView | null>(null)
  const [pendiente, iniciarTransicion] = React.useTransition()

  const aprobar = (entrega: EntregaView) => {
    iniciarTransicion(async () => {
      const resultado = await revisarEncargo(entrega.id, 'aprobado')
      if (resultado.ok) toast.success(`"${entrega.titulo}" aprobado ✓`)
      else toast.error(resultado.mensaje)
    })
  }

  if (entregas.length === 0) return null

  return (
    <Card className="gap-3 border-marca-violeta/30 px-4 py-4 sm:px-5">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <InboxIcon aria-hidden className="size-4 text-marca-violeta" />
        Por revisar ({entregas.length})
      </p>
      <ul className="flex flex-col gap-2">
        {entregas.map((entrega) => (
          <li key={entrega.id}>
            <Card className="px-3.5 py-3">
              <CardContent className="flex flex-col gap-2 p-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entrega.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {entrega.trabajador}
                    {entrega.cliente ? ` · ${entrega.cliente}` : ''}
                    {entrega.entregadoEn
                      ? ` · entregado ${formatoFechaHora(entrega.entregadoEn)}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendiente}
                    onClick={() => setPidiendo(entrega)}
                  >
                    <UndoIcon data-icon="inline-start" aria-hidden />
                    Pedir cambios
                  </Button>
                  <Button
                    size="sm"
                    disabled={pendiente}
                    onClick={() => aprobar(entrega)}
                  >
                    <CheckIcon data-icon="inline-start" aria-hidden />
                    Aprobar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <PedirCambiosDialog
        entrega={pidiendo}
        onCerrar={() => setPidiendo(null)}
      />
    </Card>
  )
}

function PedirCambiosDialog({
  entrega,
  onCerrar,
}: {
  entrega: EntregaView | null
  onCerrar: () => void
}) {
  return (
    <Dialog open={entrega !== null} onOpenChange={(abre) => !abre && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        {entrega ? (
          // key remonta el form por entrega: comentario siempre limpio.
          <FormCambios key={entrega.id} entrega={entrega} onCerrar={onCerrar} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function FormCambios({
  entrega,
  onCerrar,
}: {
  entrega: EntregaView
  onCerrar: () => void
}) {
  const [comentario, setComentario] = React.useState('')
  const [pendiente, iniciarTransicion] = React.useTransition()

  const enviar = () => {
    iniciarTransicion(async () => {
      const resultado = await revisarEncargo(entrega.id, 'cambios', comentario)
      if (resultado.ok) {
        toast.success('Cambios solicitados — el encargo regresó al integrante')
        onCerrar()
      } else {
        toast.error(resultado.mensaje)
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pedir cambios</DialogTitle>
        <DialogDescription>
          {`"${entrega.titulo}" regresará a ${entrega.trabajador} con tu comentario.`}
        </DialogDescription>
      </DialogHeader>
      <Textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={4}
        placeholder="Qué hay que ajustar…"
        aria-label="Comentario de cambios"
      />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button
          disabled={pendiente || comentario.trim().length === 0}
          onClick={enviar}
        >
          {pendiente ? 'Enviando…' : 'Enviar cambios'}
        </Button>
      </DialogFooter>
    </>
  )
}
