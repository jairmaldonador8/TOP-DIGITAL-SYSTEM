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
  /** Nombre del cliente: si ya no está activo se agrega como opción. */
  cliente?: string | null
  descripcion: string | null
  tipo: string
  origen: 'sistema' | 'google'
}

const SIN_CLIENTE = ''

type OpcionAviso = { value: string; label: string }

function opcionesAviso(actual: number | null): OpcionAviso[] {
  const lista: OpcionAviso[] = [...AVISOS_MIN]
  if (actual == null || lista.some((a) => a.value === String(actual))) return lista
  return [...lista, { value: String(actual), label: `${actual} min antes` }]
}

/** Formulario de cita: lo usa la hoja "+" tanto para crear como editar. */
export function CitaForm({
  clientes,
  cita,
  hoy,
  alExito,
}: {
  clientes: ClienteOpcionCita[]
  cita?: CitaEditable
  /** 'YYYY-MM-DD' de hoy (del server): día por defecto al crear. */
  hoy: string
  alExito: () => void
}) {
  const [estado, enviar, pendiente] = useActionState<ResultadoAccion, FormData>(
    cita ? editarCita : crearCita,
    null
  )
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, iniciarEliminar] = useTransition()

  // Booleano (no el objeto `cita`): un refresco trae otra referencia y
  // no debe repetir el aviso.
  const editando = cita != null
  useEffect(() => {
    if (estado?.ok) {
      toast.success(editando ? 'Cambios guardados' : 'Cita guardada 📅')
      alExito()
    }
  }, [estado, alExito, editando])

  const errores = estado && !estado.ok ? estado.errores : {}
  const capturados = estado && !estado.ok ? estado.valores : {}
  const inicial: Record<string, string> = cita
    ? {
        titulo: cita.titulo,
        cliente_id: cita.clienteId ?? SIN_CLIENTE,
        fecha: cita.fecha,
        // Postgres regresa `time` como HH:MM:SS; el input solo acepta HH:MM.
        hora: cita.hora?.slice(0, 5) ?? '',
        hora_fin: cita.horaFin?.slice(0, 5) ?? '',
        lugar: cita.lugar ?? '',
        tipo: cita.tipo,
        aviso_min: cita.avisoMin != null ? String(cita.avisoMin) : '',
        descripcion: cita.descripcion ?? '',
      }
    : { fecha: hoy }
  const valores = { ...inicial, ...capturados }

  // Sin hora = todo el día: se esconden "Termina" y "Avisarme".
  const [hora, setHora] = useState(valores.hora ?? '')
  const todoElDia = hora === ''

  // Un aviso guardado fuera de la lista se agrega para que el Select no
  // salga en blanco.
  const avisos = opcionesAviso(cita?.avisoMin ?? null)

  // Igual con el cliente: si ya no está en la lista (inactivo), se agrega
  // para que el Select lo muestre en vez de quedar en blanco.
  const opcionesCliente = [
    { value: SIN_CLIENTE, label: 'Sin cliente' },
    ...clientes.map((c) => ({ value: c.id, label: c.nombre_negocio })),
  ]
  if (cita?.clienteId && !clientes.some((c) => c.id === cita.clienteId)) {
    opcionesCliente.push({ value: cita.clienteId, label: cita.cliente ?? 'Cliente inactivo' })
  }

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
          className="h-11 text-base md:text-base"
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
          items={opcionesCliente}
        >
          <SelectTrigger id="cliente_id" className="w-full data-[size=default]:h-11 text-base md:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opcionesCliente.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
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
          className="h-11 text-base md:text-base"
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
            className="h-11 text-base md:text-base"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            aria-invalid={errores.hora ? true : undefined}
            aria-describedby={describedBy('hora', errores.hora)}
          />
        </Campo>
        {todoElDia ? (
          <p className="self-center rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Todo el día · sale en tu resumen de la mañana
          </p>
        ) : (
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
              className="h-11 text-base md:text-base"
              defaultValue={valores.hora_fin ?? ''}
              aria-invalid={errores.hora_fin ? true : undefined}
              aria-describedby={describedBy('hora_fin', errores.hora_fin)}
            />
          </Campo>
        )}
      </div>

      <Campo id="lugar" etiqueta="Lugar" descripcion="Opcional" error={errores.lugar}>
        <Input
          id="lugar"
          name="lugar"
          className="h-11 text-base md:text-base"
          placeholder="Oficina del cliente, Zoom, dirección…"
          defaultValue={valores.lugar ?? ''}
          aria-invalid={errores.lugar ? true : undefined}
          aria-describedby={describedBy('lugar', errores.lugar)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" etiqueta="Tipo" error={errores.tipo}>
          <Select name="tipo" defaultValue={valores.tipo ?? 'junta'} items={TIPOS_CITA}>
            <SelectTrigger id="tipo" className="w-full data-[size=default]:h-11 text-base md:text-base">
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
        {todoElDia ? null : (
          <Campo id="aviso_min" etiqueta="Avisarme" error={errores.aviso_min}>
            <Select
              name="aviso_min"
              defaultValue={valores.aviso_min ?? '30'}
              items={avisos}
            >
              <SelectTrigger id="aviso_min" className="w-full data-[size=default]:h-11 text-base md:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {avisos.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
        )}
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
          className="text-base md:text-base"
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
