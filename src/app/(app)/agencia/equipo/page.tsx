import type { Metadata } from 'next'

import {
  BandejaRevision,
  type EntregaView,
} from '@/components/equipo/bandeja-revision'
import {
  EncargoFormDialog,
  TrabajadorFormDialog,
  type ClienteOpcionEquipo,
  type TrabajadorOpcion,
} from '@/components/equipo/formularios-equipo'
import { Card, CardContent } from '@/components/ui/card'
import type { EstadoEncargo } from '@/lib/equipo/transiciones'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Equipo',
}

type FilaIntegrante = {
  user_id: string
  nombre: string | null
  puesto: string | null
}

type FilaEncargo = {
  id: string
  titulo: string
  descripcion: string | null
  estado: EstadoEncargo
  asignado_a: string
  cliente_id: string | null
  entregado_en: string | null
}

export default async function PaginaEquipoAgencia() {
  const supabase = await createClient()

  const [integrantesRes, encargosRes, clientesRes] = await Promise.all([
    supabase
      .from('usuarios')
      .select('user_id, nombre, puesto')
      .eq('rol', 'equipo')
      .order('nombre'),
    supabase
      .from('encargos')
      .select(
        'id, titulo, descripcion, estado, asignado_a, cliente_id, entregado_en'
      ),
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .eq('es_agencia', false)
      .order('nombre_negocio'),
  ])

  if (integrantesRes.error) {
    console.error('Error al cargar integrantes:', integrantesRes.error)
  }

  const integrantes = (integrantesRes.data ?? []) as FilaIntegrante[]
  const encargos = (encargosRes.data ?? []) as FilaEncargo[]
  const clientes = (clientesRes.data ?? []) as ClienteOpcionEquipo[]
  const nombreCliente = new Map(clientes.map((c) => [c.id, c.nombre_negocio]))
  const nombreIntegrante = new Map(
    integrantes.map((i) => [i.user_id, i.nombre ?? 'Integrante'])
  )

  const trabajadores: TrabajadorOpcion[] = integrantes.map((i) => ({
    userId: i.user_id,
    nombre: i.nombre ?? 'Integrante',
    puesto: i.puesto ?? '—',
  }))

  const entregas: EntregaView[] = encargos
    .filter((e) => e.estado === 'entregado')
    .sort((a, b) => (a.entregado_en ?? '').localeCompare(b.entregado_en ?? ''))
    .map((e) => ({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      trabajador: nombreIntegrante.get(e.asignado_a) ?? 'Integrante',
      cliente: e.cliente_id ? (nombreCliente.get(e.cliente_id) ?? null) : null,
      entregadoEn: e.entregado_en,
    }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna encargos, revisa entregas y dale seguimiento a tu gente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TrabajadorFormDialog />
          {trabajadores.length > 0 ? (
            <EncargoFormDialog
              trabajadores={trabajadores}
              clientes={clientes}
            />
          ) : null}
        </div>
      </header>

      <BandejaRevision entregas={entregas} />

      {integrantes.length === 0 ? (
        <Card className="items-center gap-3 py-14 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Aún no hay integrantes. Crea la primera cuenta con «Nuevo
            integrante» y empieza a asignar encargos.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrantes.map((integrante) => {
            const suyos = encargos.filter(
              (e) => e.asignado_a === integrante.user_id
            )
            const activos = suyos.filter(
              (e) =>
                e.estado === 'pendiente' ||
                e.estado === 'en_progreso' ||
                e.estado === 'cambios'
            ).length
            const porRevisar = suyos.filter(
              (e) => e.estado === 'entregado'
            ).length
            const aprobados = suyos.filter(
              (e) => e.estado === 'aprobado'
            ).length
            return (
              <Card key={integrante.user_id} className="gap-3 px-4 py-4">
                <CardContent className="flex flex-col gap-2 p-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {integrante.nombre ?? 'Integrante'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {integrante.puesto ?? '—'}
                      </p>
                    </div>
                    {porRevisar > 0 ? (
                      <span className="bg-marca inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-xs font-semibold whitespace-nowrap text-white">
                        {porRevisar} por revisar
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activos} {activos === 1 ? 'activo' : 'activos'} ·{' '}
                    {aprobados} {aprobados === 1 ? 'aprobado' : 'aprobados'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
