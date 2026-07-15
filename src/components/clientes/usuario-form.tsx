'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { UserRoundPlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  crearUsuarioCliente,
  type ResultadoAccion,
} from '@/app/(app)/agencia/clientes/actions'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Dialog para dar acceso al portal a una persona del cliente: crea el
 * usuario de auth y su fila en usuarios (rol cliente) vía Server Action.
 */
export function UsuarioFormDialog({
  clienteId,
  nombreNegocio,
}: {
  clienteId: string
  nombreNegocio: string
}) {
  const [abierto, setAbierto] = useState(false)
  // Cambia en cada apertura para remontar el formulario (estado limpio).
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback((email?: string) => {
    toast.success('Usuario creado', {
      description: email
        ? `Comparte las credenciales de ${email} con el cliente por un medio seguro.`
        : undefined,
      duration: 8000,
    })
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserRoundPlusIcon data-icon="inline-start" />
        Agregar usuario
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar usuario</DialogTitle>
          <DialogDescription>
            Esta persona podrá entrar al portal de {nombreNegocio} con el
            correo y la contraseña que definas aquí.
          </DialogDescription>
        </DialogHeader>
        <FormularioUsuario key={epoca} clienteId={clienteId} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioUsuario({
  clienteId,
  alExito,
}: {
  clienteId: string
  alExito: (email?: string) => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearUsuarioCliente.bind(null, clienteId),
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito(estado.email)
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="usuario-nombre">Nombre</Label>
        <Input
          id="usuario-nombre"
          name="nombre"
          placeholder="Nombre y apellido"
          defaultValue={valores.nombre ?? ''}
          aria-invalid={errores.nombre ? true : undefined}
          required
        />
        {errores.nombre ? (
          <p role="alert" className="text-xs text-destructive">
            {errores.nombre}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="usuario-email">Correo electrónico</Label>
        <Input
          id="usuario-email"
          name="email"
          type="email"
          autoComplete="off"
          placeholder="persona@negocio.mx"
          defaultValue={valores.email ?? ''}
          aria-invalid={errores.email ? true : undefined}
          required
        />
        {errores.email ? (
          <p role="alert" className="text-xs text-destructive">
            {errores.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="usuario-password">Contraseña temporal</Label>
        <Input
          id="usuario-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errores.password ? true : undefined}
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        {errores.password ? (
          <p role="alert" className="text-xs text-destructive">
            {errores.password}
          </p>
        ) : null}
      </div>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Creando…' : 'Crear usuario'}
        </Button>
      </DialogFooter>
    </form>
  )
}
