'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { crearCita, editarCita, eliminarCita } from '@/app/(app)/agencia/agenda/actions'
import { Campo, describedBy } from '@/components/formularios/campo'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
import { AVISOS_MIN, TIPOS_CITA } from '@/lib/agenda/cita'

export type ClienteOpcionCita = { id: string; nombre_negocio: string }

export type CitaEditable = {
  id: string
  titulo: string
  fecha: string
  hora: string | null
  horaFin: string | null
  lugar: string | null
  avisoMin: number | null
  clienteId: string | null
  descripcion: string | null
  tipo: string
  origen: 'sistema' | 'google'
}

const SIN_CLIENTE = ''

/** Formulario de cita: lo usa la hoja "+" tanto para crear como editar. */
export function CitaForm({
  clientes,
  cita,
  alExito,
}: {
  clientes: ClienteOpcionCita[]
  cita?: CitaEditable
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    cita ? editarCita : crearCita,
    null
  )
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, iniciarEliminar] = useTransition()

  useEffect(() => {
    if (estado?.ok) alExito()
  }, [estado, alExito])

  const errores = estado && !estado.ok ? estado.errores : {}
  const capturados = estado && !estado.ok ? estado.valores : {}
  const inicial: Record<string, string> = cita
    ? {
        titulo: cita.titulo,
        cliente_id: cita.clienteId ?? SIN_CLIENTE,
        fecha: cita.fecha,
        hora: cita.hora ?? '',
        hora_fin: cita.horaFin ?? '',
        lugar: cita.lugar ?? '',
        tipo: cita.tipo,
        aviso_min: cita.avisoMin != null ? String(cita.avisoMin) : '',
        descripcion: cita.descripcion ?? '',
      }
    : {}
  const valores = { ...inicial, ...capturados }

  const eliminar = () => {
    if (!cita) return
    iniciarEliminar(async () => {
      const resultado = await eliminarCita(cita.id)
      if (resultado.ok) {
        toast.success('Cita eliminada')
        setConfirmando(false)
        alExito()
      } else {
        toast.error(resultado.mensaje)
      }
    })
  }

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {cita ? <input type="hidden" name="id" value={cita.id} /> : null}

      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <Input
          id="titulo"
          name="titulo"
          className="h-11 text-base"
          placeholder="Junta con el cliente"
          defaultValue={valores.titulo ?? ''}
          maxLength={200}
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={describedBy('titulo', errores.titulo)}
          required
        />
      </Campo>

      {cita?.origen === 'google' ? (
        <p className="text-xs text-muted-foreground">
          Viene de tu Google Calendar — los cambios se espejean en la fase 3.
        </p>
      ) : null}

      <Campo
        id="cliente_id"
        etiqueta="Cliente"
        descripcion="Opcional"
        error={errores.cliente_id}
      >
        <Select
          name="cliente_id"
          defaultValue={valores.cliente_id ?? SIN_CLIENTE}
          items={[
            { value: SIN_CLIENTE, label: 'Sin cliente' },
            ...clientes.map((c) => ({ value: c.id, label: c.nombre_negocio })),
          ]}
        >
          <SelectTrigger id="cliente_id" className="h-11 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_CLIENTE}>Sin cliente</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nombre_negocio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo id="fecha" etiqueta="Día" error={errores.fecha}>
        <Input
          id="fecha"
          name="fecha"
          type="date"
          className="h-11 text-base"
          defaultValue={valores.fecha ?? ''}
          aria-invalid={errores.fecha ? true : undefined}
          aria-describedby={describedBy('fecha', errores.fecha)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="hora"
          etiqueta="Hora"
          descripcion="Vacía = todo el día"
          error={errores.hora}
        >
          <Input
            id="hora"
            name="hora"
            type="time"
            className="h-11 text-base"
            defaultValue={valores.hora ?? ''}
            aria-invalid={errores.hora ? true : undefined}
            aria-describedby={describedBy('hora', errores.hora)}
          />
        </Campo>
        <Campo
          id="hora_fin"
          etiqueta="Termina"
          descripcion="Opcional"
          error={errores.hora_fin}
        >
          <Input
            id="hora_fin"
            name="hora_fin"
            type="time"
            className="h-11 text-base"
            defaultValue={valores.hora_fin ?? ''}
            aria-invalid={errores.hora_fin ? true : undefined}
            aria-describedby={describedBy('hora_fin', errores.hora_fin)}
          />
        </Campo>
      </div>

      <Campo id="lugar" etiqueta="Lugar" descripcion="Opcional" error={errores.lugar}>
        <Input
          id="lugar"
          name="lugar"
          className="h-11 text-base"
          placeholder="Oficina del cliente, Zoom, dirección…"
          defaultValue={valores.lugar ?? ''}
          aria-invalid={errores.lugar ? true : undefined}
          aria-describedby={describedBy('lugar', errores.lugar)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" etiqueta="Tipo" error={errores.tipo}>
          <Select name="tipo" defaultValue={valores.tipo ?? 'junta'} items={TIPOS_CITA}>
            <SelectTrigger id="tipo" className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CITA.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="aviso_min" etiqueta="Avisarme" error={errores.aviso_min}>
          <Select
            name="aviso_min"
            defaultValue={valores.aviso_min ?? '30'}
            items={AVISOS_MIN}
          >
            <SelectTrigger id="aviso_min" className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVISOS_MIN.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </div>

      <Campo
        id="descripcion"
        etiqueta="Notas"
        descripcion="Opcional"
        error={errores.descripcion}
      >
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          placeholder="Contexto, acuerdos, links…"
          defaultValue={valores.descripcion ?? ''}
        />
      </Campo>

      {errores._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errores._form}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pendiente}
        className="bg-marca h-12 w-full rounded-full text-base font-semibold text-white"
      >
        {pendiente ? 'Guardando…' : 'Guardar'}
      </Button>

      {cita ? (
        <>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full text-destructive hover:text-destructive"
            onClick={() => setConfirmando(true)}
          >
            Eliminar cita
          </Button>
          <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
                <AlertDialogDescription>
                  No se puede deshacer. Se quitará de tu agenda
                  {cita.origen === 'google' ? ' y de Google Calendar' : ''}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="outline" />}>
                  Cancelar
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  disabled={eliminando}
                  onClick={eliminar}
                >
                  {eliminando ? 'Eliminando…' : 'Eliminar'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </form>
  )
}
