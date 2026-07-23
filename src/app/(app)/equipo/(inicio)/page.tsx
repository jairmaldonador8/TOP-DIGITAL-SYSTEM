import type { Metadata } from 'next'

import {
  ListaEncargos,
  type EncargoView,
} from '@/components/equipo/lista-encargos'
import { Card } from '@/components/ui/card'
import { CifraAnimada } from '@/components/paneles/cifra-animada'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import type {
  EstadoEncargo,
  PrioridadEncargo,
} from '@/lib/equipo/transiciones'
import { formatoFechaLarga, inicioDeMes } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Mis encargos',
}

type FilaEncargoDb = {
  id: string
  titulo: string
  descripcion: string | null
  prioridad: PrioridadEncargo
  estado: EstadoEncargo
  fecha_limite: string | null
  comentario_revision: string | null
  cliente_id: string | null
  aprobado_en: string | null
  created_at: string
}

type FichaCliente = {
  id: string
  nombre_negocio: string
  giro: string | null
  descripcion_publica: string | null
}

const ORDEN_PRIORIDAD: Record<PrioridadEncargo, number> = {
  alta: 0,
  media: 1,
  baja: 2,
}

export default async function PaginaEquipo() {
  const actual = await usuarioActual()
  const supabase = await createClient()

  // RLS limita a los encargos propios; la ficha de clientes llega por la
  // RPC segura (solo clientes con encargo del trabajador, 4 columnas).
  const [encargosRes, fichasRes] = await Promise.all([
    supabase
      .from('encargos')
      .select(
        'id, titulo, descripcion, prioridad, estado, fecha_limite, comentario_revision, cliente_id, aprobado_en, created_at'
      ),
    supabase.rpc('ficha_clientes_equipo'),
  ])

  if (encargosRes.error) {
    console.error('Error al cargar encargos:', encargosRes.error)
  }

  const filas = (encargosRes.data ?? []) as FilaEncargoDb[]
  const fichas = new Map(
    ((fichasRes.data ?? []) as FichaCliente[]).map((f) => [f.id, f])
  )

  const encargos: EncargoView[] = filas
    .map((fila) => {
      const ficha = fila.cliente_id ? fichas.get(fila.cliente_id) : null
      return {
        id: fila.id,
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        prioridad: fila.prioridad,
        estado: fila.estado,
        fechaLimite: fila.fecha_limite,
        comentarioRevision: fila.comentario_revision,
        cliente: ficha
          ? {
              nombre: ficha.nombre_negocio,
              giro: ficha.giro,
              descripcion: ficha.descripcion_publica,
            }
          : null,
      }
    })
    .sort(
      (a, b) =>
        ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] ||
        (a.fechaLimite ?? '9999').localeCompare(b.fechaLimite ?? '9999')
    )

  const desde = inicioDeMes()
  const conteo = (estado: EstadoEncargo) =>
    filas.filter((f) => f.estado === estado).length
  const aprobadosMes = filas.filter(
    (f) => f.estado === 'aprobado' && (f.aprobado_en ?? '') >= desde
  ).length

  const stats = [
    { etiqueta: 'Pendientes', valor: conteo('pendiente') + conteo('cambios') },
    { etiqueta: 'En progreso', valor: conteo('en_progreso') },
    { etiqueta: 'En revisión', valor: conteo('entregado') },
    { etiqueta: 'Aprobados del mes', valor: aprobadosMes },
  ]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {actual.nombre ?? 'Integrante'} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu trabajo del día, en orden de prioridad.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.etiqueta} className="gap-1 px-4 py-4">
            <p className="text-2xl font-bold tracking-tight">
              <CifraAnimada valor={stat.valor} />
            </p>
            <p className="text-xs text-muted-foreground">{stat.etiqueta}</p>
          </Card>
        ))}
      </div>

      <ListaEncargos encargos={encargos} />
    </div>
  )
}
