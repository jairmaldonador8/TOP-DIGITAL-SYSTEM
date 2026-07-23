import type { Metadata } from 'next'

import {
  BandejaRevision,
  type EntregaView,
} from '@/components/equipo/bandeja-revision'
import type { Mensaje } from '@/components/chat/hilo'
import {
  EncargoFormDialog,
  TrabajadorFormDialog,
  type ClienteOpcionEquipo,
  type TrabajadorOpcion,
} from '@/components/equipo/formularios-equipo'
import {
  TarjetaIntegrante,
  type EncargoDeIntegrante,
} from '@/components/equipo/tarjeta-integrante'
import { Card } from '@/components/ui/card'
import { usuarioActual } from '@/lib/auth/usuario-actual'
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
  prioridad: string
  fecha_limite: string | null
  asignado_a: string
  cliente_id: string | null
  entregado_en: string | null
}

export default async function PaginaEquipoAgencia() {
  const actual = await usuarioActual()
  const miId = typeof actual.claims?.sub === 'string' ? actual.claims.sub : null
  const supabase = await createClient()

  const [integrantesRes, encargosRes, clientesRes, mensajesRes] =
    await Promise.all([
    supabase
      .from('usuarios')
      .select('user_id, nombre, puesto')
      .eq('rol', 'equipo')
      .order('nombre'),
    supabase
      .from('encargos')
      .select(
        'id, titulo, descripcion, estado, prioridad, fecha_limite, asignado_a, cliente_id, entregado_en'
      ),
    supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('estado', 'activo')
      .eq('es_agencia', false)
      .order('nombre_negocio'),
    // Hilos de todo el equipo (pocos integrantes; últimos 100 por orden global).
    supabase
      .from('mensajes_equipo')
      .select('id, trabajador_id, autor_id, autor_nombre, texto, leido, created_at')
      .order('created_at', { ascending: false })
      .limit(300),
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

  // Hilos de chat agrupados por trabajador, en orden cronológico.
  const mensajesPorHilo = new Map<string, (Mensaje & { leido: boolean })[]>()
  for (const fila of (mensajesRes.data ?? []) as (Mensaje & {
    trabajador_id: string
    leido: boolean
  })[]) {
    const hilo = mensajesPorHilo.get(fila.trabajador_id) ?? []
    hilo.unshift(fila)
    mensajesPorHilo.set(fila.trabajador_id, hilo)
  }

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
            const hilo = mensajesPorHilo.get(integrante.user_id) ?? []
            return (
              <TarjetaIntegrante
                key={integrante.user_id}
                userId={integrante.user_id}
                nombre={integrante.nombre ?? 'Integrante'}
                puesto={integrante.puesto ?? '—'}
                activos={
                  suyos.filter(
                    (e) =>
                      e.estado === 'pendiente' ||
                      e.estado === 'en_progreso' ||
                      e.estado === 'cambios'
                  ).length
                }
                porRevisar={suyos.filter((e) => e.estado === 'entregado').length}
                aprobados={suyos.filter((e) => e.estado === 'aprobado').length}
                mensajes={hilo}
                noLeidos={
                  hilo.filter((m) => !m.leido && m.autor_id !== miId).length
                }
                miId={miId}
                encargos={suyos.map(
                  (e): EncargoDeIntegrante => ({
                    id: e.id,
                    titulo: e.titulo,
                    descripcion: e.descripcion,
                    prioridad: e.prioridad,
                    fecha_limite: e.fecha_limite,
                    asignado_a: e.asignado_a,
                    cliente_id: e.cliente_id,
                    estado: e.estado,
                  })
                )}
                trabajadores={trabajadores}
                clientes={clientes}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
