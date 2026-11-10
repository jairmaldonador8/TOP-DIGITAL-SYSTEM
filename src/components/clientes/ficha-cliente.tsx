'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import {
  guardarEquipoCliente,
  guardarKit,
  guardarOperacion,
} from '@/app/(app)/agencia/clientes/ficha-actions'
import { Campo, describedBy } from '@/components/formularios/campo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import type { KitMarca } from '@/lib/clientes/ficha'
import type { Cuota } from '@/lib/entregables/ciclo'
import {
  ETIQUETA_PUESTO,
  PUESTOS,
  type Puesto,
} from '@/lib/equipo/puestos'

export type OperacionCliente = {
  fecha_arranque: string | null
  dia_cobro: number | null
  paquete: string | null
  cuota: Cuota
  produccion_requiere_revision: boolean
}

export type IntegranteOpcion = { userId: string; nombre: string; puesto: Puesto }

const CAMPOS_CUOTA: { tipo: keyof Cuota; etiqueta: string }[] = [
  { tipo: 'imagen', etiqueta: 'Imágenes' },
  { tipo: 'carrusel', etiqueta: 'Carruseles' },
  { tipo: 'video', etiqueta: 'Videos' },
  { tipo: 'produccion', etiqueta: 'Producciones' },
  { tipo: 'guion', etiqueta: 'Guiones' },
]

/** Toast al guardar con éxito (el estado cambia de referencia en cada envío). */
function useAvisoGuardado(estado: ResultadoAccion, mensaje: string) {
  useEffect(() => {
    if (estado?.ok) toast.success(mensaje)
  }, [estado, mensaje])
}

function ErrorFormulario({ estado }: { estado: ResultadoAccion }) {
  if (!estado || estado.ok || !estado.errores._form) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {estado.errores._form}
    </p>
  )
}

export function FichaOperacion({
  clienteId,
  operacion,
}: {
  clienteId: string
  operacion: OperacionCliente
}) {
  const [estado, accion, enviando] = useActionState(
    guardarOperacion.bind(null, clienteId),
    null
  )
  useAvisoGuardado(estado, 'Operación guardada')
  const errores = estado && !estado.ok ? estado.errores : {}
  const valores = estado && !estado.ok ? estado.valores : null
  const v = (campo: string, base: string | number | null | undefined) =>
    valores?.[campo] ?? (base == null ? '' : String(base))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operación</CardTitle>
        <CardDescription>
          Con la cuota se crean solas las piezas de cada ciclo (días 1 y 15).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accion} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="fecha_arranque" etiqueta="Arranque" error={errores.fecha_arranque}>
              <Input
                id="fecha_arranque"
                name="fecha_arranque"
                type="date"
                defaultValue={v('fecha_arranque', operacion.fecha_arranque)}
                aria-describedby={describedBy('fecha_arranque', errores.fecha_arranque)}
              />
            </Campo>
            <Campo id="dia_cobro" etiqueta="Día de cobro" error={errores.dia_cobro}>
              <Input
                id="dia_cobro"
                name="dia_cobro"
                inputMode="numeric"
                placeholder="1–31"
                defaultValue={v('dia_cobro', operacion.dia_cobro)}
                aria-describedby={describedBy('dia_cobro', errores.dia_cobro)}
              />
            </Campo>
            <Campo id="paquete" etiqueta="Paquete" error={errores.paquete}>
              <Input
                id="paquete"
                name="paquete"
                placeholder="Ej. Crecimiento"
                defaultValue={v('paquete', operacion.paquete)}
              />
            </Campo>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Cuota por ciclo</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CAMPOS_CUOTA.map(({ tipo, etiqueta }) => {
                const campo = `cuota_${tipo}`
                return (
                  <Campo key={tipo} id={campo} etiqueta={etiqueta} error={errores[campo]}>
                    <Input
                      id={campo}
                      name={campo}
                      inputMode="numeric"
                      placeholder="0"
                      className="h-11 text-center text-base tabular-nums"
                      defaultValue={v(campo, operacion.cuota[tipo])}
                      aria-invalid={errores[campo] ? true : undefined}
                      aria-describedby={describedBy(campo, errores[campo])}
                    />
                  </Campo>
                )
              })}
            </div>
          </fieldset>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="produccion_requiere_revision"
              defaultChecked={operacion.produccion_requiere_revision}
              className="size-5 accent-[#f0338d]"
            />
            El material del filmmaker pasa por revisión antes de llegar al editor
          </label>

          <ErrorFormulario estado={estado} />
          <Button type="submit" disabled={enviando} className="h-11 self-start">
            {enviando ? 'Guardando…' : 'Guardar operación'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function FichaKit({ clienteId, kit }: { clienteId: string; kit: Partial<KitMarca> }) {
  const [estado, accion, enviando] = useActionState(guardarKit.bind(null, clienteId), null)
  useAvisoGuardado(estado, 'Kit de marca guardado')
  const colores = kit.colores ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kit de marca</CardTitle>
        <CardDescription>Lo ve el equipo asignado en cada pieza de este cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accion} className="flex flex-col gap-5">
          <Campo id="colores" etiqueta="Colores" descripcion="Hexadecimales separados por coma: #921817, #FFFFFF">
            <Input id="colores" name="colores" defaultValue={colores.join(', ')} />
          </Campo>
          {colores.length > 0 ? (
            <div className="flex flex-wrap gap-2" aria-label="Muestras de color">
              {colores.map((c) => (
                <span key={c} className="flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
                  <span className="size-4 rounded-full border" style={{ backgroundColor: c }} />
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          <Campo id="tipografias" etiqueta="Tipografías" descripcion="Separadas por coma">
            <Input id="tipografias" name="tipografias" defaultValue={(kit.tipografias ?? []).join(', ')} />
          </Campo>
          <Campo id="tono" etiqueta="Tono de comunicación">
            <Input id="tono" name="tono" placeholder="Cercano, directo, con humor…" defaultValue={kit.tono ?? ''} />
          </Campo>
          <Campo id="notas_marca" etiqueta="Notas para el equipo">
            <Textarea id="notas_marca" name="notas_marca" rows={3} defaultValue={kit.notas ?? ''} />
          </Campo>
          <ErrorFormulario estado={estado} />
          <Button type="submit" disabled={enviando} className="h-11 self-start">
            {enviando ? 'Guardando…' : 'Guardar kit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function FichaEquipo({
  clienteId,
  asignados,
  integrantes,
}: {
  clienteId: string
  asignados: Partial<Record<Puesto, string>>
  integrantes: IntegranteOpcion[]
}) {
  const [estado, accion, enviando] = useActionState(
    guardarEquipoCliente.bind(null, clienteId),
    null
  )
  useAvisoGuardado(estado, 'Equipo asignado')
  const errores = estado && !estado.ok ? estado.errores : {}
  const SIN = ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo del cliente</CardTitle>
        <CardDescription>
          Cada quien ve solo a los clientes donde está asignado. Las piezas del ciclo se reparten solas por puesto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accion} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {PUESTOS.map((puesto) => {
              const campo = `equipo_${puesto}`
              const opciones = integrantes.filter((i) => i.puesto === puesto)
              const items = [
                { value: SIN, label: 'Sin asignar' },
                ...opciones.map((i) => ({ value: i.userId, label: i.nombre })),
              ]
              return (
                <Campo key={puesto} id={campo} etiqueta={ETIQUETA_PUESTO[puesto]} error={errores[campo]}>
                  <Select name={campo} defaultValue={asignados[puesto] ?? SIN} items={items}>
                    <SelectTrigger id={campo} className="h-11 w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it.value || 'sin'} value={it.value}>
                          {it.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
              )
            })}
          </div>
          {integrantes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay integrantes con puesto. Dalos de alta en Equipo.
            </p>
          ) : null}
          <ErrorFormulario estado={estado} />
          <Button type="submit" disabled={enviando} className="h-11 self-start">
            {enviando ? 'Guardando…' : 'Guardar equipo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
