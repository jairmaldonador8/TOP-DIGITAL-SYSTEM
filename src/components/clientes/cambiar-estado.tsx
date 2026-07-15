'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cambiarEstadoCliente } from '@/app/(app)/agencia/clientes/actions'
import type { EstadoCliente } from '@/components/clientes/estado-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Botón Desactivar (con confirmación) o Reactivar según el estado actual.
 * Nunca borra al cliente: solo alterna estado activo/inactivo.
 */
export function BotonCambiarEstado({
  clienteId,
  estado,
  nombreNegocio,
}: {
  clienteId: string
  estado: EstadoCliente
  nombreNegocio: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [pendiente, iniciarTransicion] = useTransition()

  const ejecutar = (nuevoEstado: 'activo' | 'inactivo') => {
    iniciarTransicion(async () => {
      const resultado = await cambiarEstadoCliente(clienteId, nuevoEstado)
      if (resultado.ok) {
        toast.success(
          nuevoEstado === 'inactivo'
            ? 'Cliente desactivado'
            : 'Cliente reactivado'
        )
        setAbierto(false)
      } else {
        toast.error(resultado.mensaje)
      }
    })
  }

  if (estado === 'inactivo') {
    return (
      <Button
        variant="outline"
        disabled={pendiente}
        onClick={() => ejecutar('activo')}
      >
        {pendiente ? 'Reactivando…' : 'Reactivar'}
      </Button>
    )
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={<Button variant="destructive" />}>
        Desactivar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Desactivar cliente?</DialogTitle>
          <DialogDescription>
            “{nombreNegocio}” pasará a estado inactivo y dejará de aparecer
            como cliente activo. No se borra ningún dato: sus leads,
            campañas e historial se conservan y puedes reactivarlo cuando
            quieras.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pendiente}
            onClick={() => ejecutar('inactivo')}
          >
            {pendiente ? 'Desactivando…' : 'Sí, desactivar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
