'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { PlusIcon, UserPlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  crearEncargo,
  crearTrabajador,
} from '@/app/(app)/agencia/equipo/actions'
import { Campo, describedBy } from '@/components/formularios/campo'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ResultadoAccion } from '@/lib/acciones'

export type TrabajadorOpcion = { userId: string; nombre: string; puesto: string }
export type ClienteOpcionEquipo = { id: string; nombre_negocio: string }

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

/** Dialog "+ Nuevo encargo" del encabezado de Equipo. */
export function EncargoFormDialog({
  trabajadores,
  clientes,
}: {
  trabajadores: TrabajadorOpcion[]
  clientes: ClienteOpcionEquipo[]
}) {
  const [abierto, setAbierto] = useState(false)
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback(() => {
    toast.success('Encargo asignado 📋')
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Nuevo encargo
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo encargo</DialogTitle>
          <DialogDescription>
            Describe el trabajo con todo el detalle que necesite: qué es,
            para qué cliente, características, referencias.
          </DialogDescription>
        </DialogHeader>
        <FormularioEncargo
          key={epoca}
          trabajadores={trabajadores}
          clientes={clientes}
          alExito={alExito}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioEncargo({
  trabajadores,
  clientes,
  alExito,
}: {
  trabajadores: TrabajadorOpcion[]
  clientes: ClienteOpcionEquipo[]
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearEncargo,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <Input
          id="titulo"
          name="titulo"
          placeholder="3 posts para redes · promo de julio"
          defaultValue={valores.titulo ?? ''}
          maxLength={200}
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={describedBy('titulo', errores.titulo)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="asignado_a" etiqueta="Asignar a" error={errores.asignado_a}>
          <Select
            name="asignado_a"
            defaultValue={valores.asignado_a ?? null}
            items={trabajadores.map((t) => ({
              value: t.userId,
              label: `${t.nombre} · ${t.puesto}`,
            }))}
          >
            <SelectTrigger
              id="asignado_a"
              className="w-full"
              aria-invalid={errores.asignado_a ? true : undefined}
              aria-describedby={describedBy('asignado_a', errores.asignado_a)}
            >
              <SelectValue placeholder="¿Quién lo hace?" />
            </SelectTrigger>
            <SelectContent>
              {trabajadores.map((t) => (
                <SelectItem key={t.userId} value={t.userId}>
                  {t.nombre} · {t.puesto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo
          id="cliente_id"
          etiqueta="Cliente"
          descripcion="Opcional"
          error={errores.cliente_id}
        >
          <Select
            name="cliente_id"
            defaultValue={valores.cliente_id ?? null}
            items={clientes.map((c) => ({
              value: c.id,
              label: c.nombre_negocio,
            }))}
          >
            <SelectTrigger id="cliente_id" className="w-full">
              <SelectValue placeholder="¿Para qué cliente?" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre_negocio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </div>

      <Campo
        id="descripcion"
        etiqueta="Descripción"
        descripcion="Características, referencias, links, montos — todo lo que necesite saber"
        error={errores.descripcion}
      >
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          placeholder="Formato 1080×1350, estilo de la marca, incluir promo 2x1…"
          defaultValue={valores.descripcion ?? ''}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="prioridad" etiqueta="Prioridad" error={errores.prioridad}>
          <Select
            name="prioridad"
            defaultValue={valores.prioridad ?? 'media'}
            items={PRIORIDADES}
          >
            <SelectTrigger id="prioridad" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORIDADES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo
          id="fecha_limite"
          etiqueta="Fecha de entrega"
          descripcion="Opcional"
          error={errores.fecha_limite}
        >
          <Input
            id="fecha_limite"
            name="fecha_limite"
            type="date"
            defaultValue={valores.fecha_limite ?? ''}
            aria-invalid={errores.fecha_limite ? true : undefined}
            aria-describedby={describedBy('fecha_limite', errores.fecha_limite)}
          />
        </Campo>
      </div>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Asignando…' : 'Asignar encargo'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Dialog "Nuevo integrante" — alta de cuenta del equipo. */
export function TrabajadorFormDialog() {
  const [abierto, setAbierto] = useState(false)
  const [epoca, setEpoca] = useState(0)

  const abrir = (abierto: boolean) => {
    if (abierto) setEpoca((n) => n + 1)
    setAbierto(abierto)
  }

  const alExito = useCallback((email?: string) => {
    toast.success(
      email ? `Cuenta creada — ya puede entrar con ${email}` : 'Cuenta creada'
    )
    setAbierto(false)
  }, [])

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UserPlusIcon data-icon="inline-start" />
        Nuevo integrante
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo integrante del equipo</DialogTitle>
          <DialogDescription>
            Crea su cuenta; con su correo y contraseña entra directo a su
            tablero de encargos.
          </DialogDescription>
        </DialogHeader>
        <FormularioTrabajador key={epoca} alExito={alExito} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioTrabajador({
  alExito,
}: {
  alExito: (email?: string) => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    crearTrabajador,
    null
  )

  useEffect(() => {
    if (estado?.ok) alExito(estado.email)
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : {}

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ana López"
          defaultValue={valores.nombre ?? ''}
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={describedBy('nombre', errores.nombre)}
          required
        />
      </Campo>
      <Campo id="puesto" etiqueta="Puesto" error={errores.puesto}>
        <Input
          id="puesto"
          name="puesto"
          placeholder="Diseño gráfico"
          defaultValue={valores.puesto ?? ''}
          aria-invalid={errores.puesto ? true : undefined}
          aria-describedby={describedBy('puesto', errores.puesto)}
          required
        />
      </Campo>
      <Campo id="email" etiqueta="Correo" error={errores.email}>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ana@correo.com"
          defaultValue={valores.email ?? ''}
          aria-invalid={errores.email ? true : undefined}
          aria-describedby={describedBy('email', errores.email)}
          required
        />
      </Campo>
      <Campo
        id="password"
        etiqueta="Contraseña"
        descripcion="Mínimo 8 caracteres; compártesela en persona"
        error={errores.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errores.password ? true : undefined}
          aria-describedby={describedBy('password', errores.password)}
          required
        />
      </Campo>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </DialogFooter>
    </form>
  )
}
