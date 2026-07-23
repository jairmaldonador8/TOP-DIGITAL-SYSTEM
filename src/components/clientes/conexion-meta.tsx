'use client'

import * as React from 'react'
import { ChevronDownIcon, PlugIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  listarCuentasMeta,
  vincularCuentaMeta,
} from '@/app/(app)/agencia/clientes/meta-actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Cuenta = { id: string; nombre: string; numero: string; activa: boolean }

/**
 * Card "Conexión Meta" del detalle de cliente (lado agencia): vincular o
 * desvincular la cuenta publicitaria de Meta de la que se sincronizan
 * las campañas. Solo llama server actions; nunca toca lib/meta directo.
 */
export function ConexionMeta({
  clienteId,
  metaAdAccountId,
}: {
  clienteId: string
  metaAdAccountId: string | null
}) {
  const [cuentas, setCuentas] = React.useState<Cuenta[] | null>(null)
  const [errorLista, setErrorLista] = React.useState<string | null>(null)
  const [confirmando, setConfirmando] = React.useState(false)
  const [pendiente, iniciarTransicion] = React.useTransition()

  const cargar = async () => {
    const resultado = await listarCuentasMeta()
    if (resultado.ok) {
      setErrorLista(null)
      if (resultado.cuentas.length === 0) {
        setCuentas(null)
        setErrorLista(
          'El usuario de sistema no tiene cuentas publicitarias asignadas en Meta.'
        )
      } else {
        setCuentas(resultado.cuentas)
      }
    } else {
      // El mensaje se queda en la card: el dueño debe ver el problema
      // de conexión, no solo un toast que desaparece.
      setCuentas(null)
      setErrorLista(resultado.mensaje)
      toast.error(resultado.mensaje)
    }
  }

  const cargarCuentas = () => {
    iniciarTransicion(cargar)
  }

  const vincular = (cuenta: Cuenta) => {
    iniciarTransicion(async () => {
      const resultado = await vincularCuentaMeta(clienteId, cuenta.id)
      if (resultado.ok) {
        toast.success(`Cuenta "${cuenta.nombre}" vinculada`)
        setCuentas(null)
      } else {
        toast.error(resultado.mensaje)
        // La lista pudo quedar obsoleta (p. ej. la cuenta ya se vinculó a
        // otro cliente): se recarga para no volver a ofrecerla.
        await cargar()
      }
    })
  }

  const desvincular = () => {
    iniciarTransicion(async () => {
      const resultado = await vincularCuentaMeta(clienteId, null)
      if (resultado.ok) {
        toast.success('Cuenta de Meta desvinculada')
        setConfirmando(false)
      } else {
        toast.error(resultado.mensaje)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexión Meta</CardTitle>
        <CardDescription>
          {metaAdAccountId
            ? 'Las campañas de esta cuenta publicitaria se sincronizan solas.'
            : 'Vincula la cuenta publicitaria del cliente para sincronizar sus campañas de Meta.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        {metaAdAccountId ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-sm text-foreground">
                {metaAdAccountId}
              </span>
              <span className="bg-marca inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-4xl px-2 text-xs font-medium whitespace-nowrap text-white">
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
                Conectado
              </span>
            </div>
            <Dialog open={confirmando} onOpenChange={setConfirmando}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Desvincular
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Desvincular cuenta de Meta?</DialogTitle>
                  <DialogDescription>
                    Las campañas ya sincronizadas se conservan, pero dejarán
                    de actualizarse desde Meta. Puedes volver a vincular la
                    cuenta cuando quieras.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={pendiente}
                    onClick={desvincular}
                  >
                    {pendiente ? 'Desvinculando…' : 'Sí, desvincular'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {errorLista ? (
              <p role="alert" className="text-sm text-destructive">
                {errorLista}
              </p>
            ) : null}
            {cuentas === null ? (
              <Button
                variant="outline"
                className="w-fit"
                disabled={pendiente}
                onClick={cargarCuentas}
              >
                <PlugIcon data-icon="inline-start" />
                {pendiente ? 'Cargando cuentas…' : 'Vincular cuenta'}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-fit"
                        disabled={pendiente}
                      />
                    }
                  >
                    {pendiente ? 'Vinculando…' : 'Elegir cuenta'}
                    <ChevronDownIcon data-icon="inline-end" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={4}
                    className="min-w-64"
                  >
                    {cuentas.map((cuenta) => (
                      <DropdownMenuItem
                        key={cuenta.id}
                        disabled={pendiente || !cuenta.activa}
                        onClick={() => vincular(cuenta)}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">
                            {cuenta.nombre}
                            {cuenta.activa ? '' : ' (inactiva)'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cuenta.numero}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Actualizar cuentas"
                  disabled={pendiente}
                  onClick={cargarCuentas}
                >
                  <RefreshCwIcon aria-hidden />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
