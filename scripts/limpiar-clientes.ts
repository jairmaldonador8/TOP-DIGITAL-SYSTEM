/**
 * Respaldo + borrado de los clientes actuales (spec 2026-11-09 §Limpieza).
 *
 *   npx tsx scripts/limpiar-clientes.ts             en seco: respalda y lista
 *   npx tsx scripts/limpiar-clientes.ts --confirmar borra
 *
 * Conserva el cliente es_agencia. Correr desde la raíz del repo (lee
 * .env.local). Cualquier error detiene el script antes de seguir borrando.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const llave = process.env.SUPABASE_SECRET_KEY
if (!url || !llave) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY')
const supabase = createClient(url, llave, { auth: { persistSession: false } })
const confirmar = process.argv.includes('--confirmar')

/** Tablas que se respaldan completas. */
const RESPALDO = [
  'clientes', 'usuarios', 'cliente_equipo', 'encargos', 'encargo_adjuntos', 'tareas',
  'actividades', 'seguimientos', 'leads', 'campanias', 'campania_finanzas',
  'campania_metricas_diarias', 'mensajes', 'notificaciones', 'reportes_semanales',
] as const

/** Orden de borrado por cliente_id (hijas antes que padres; sin cascade). */
const BORRADO = [
  'encargos', 'tareas', 'actividades', 'seguimientos', 'leads',
  'campania_metricas_diarias', 'campania_finanzas', 'campanias',
  'mensajes', 'notificaciones',
] as const

async function todas(tabla: string): Promise<unknown[]> {
  const filas: unknown[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select('*').range(desde, desde + 999)
    if (error) throw new Error(`Respaldo de ${tabla}: ${error.message}`)
    filas.push(...(data ?? []))
    if (!data || data.length < 1000) return filas
  }
}

async function main() {
  const respaldo: Record<string, unknown[]> = {}
  for (const tabla of RESPALDO) respaldo[tabla] = await todas(tabla)

  const dir = join(homedir(), 'OneDrive', 'Documents', 'Respaldos Top Digital')
  mkdirSync(dir, { recursive: true })
  const sello = new Date().toISOString().slice(0, 19).replace(/:/g, '')
  const archivo = join(dir, `clientes-${sello}.json`)
  writeFileSync(archivo, JSON.stringify(respaldo, null, 2))
  console.log(`Respaldo: ${archivo}`)

  const clientes = respaldo.clientes as { id: string; nombre_negocio: string; es_agencia: boolean }[]
  const aBorrar = clientes.filter((c) => !c.es_agencia)
  const ids = aBorrar.map((c) => c.id)
  console.log(`Se conservan: ${clientes.filter((c) => c.es_agencia).map((c) => c.nombre_negocio).join(', ') || '—'}`)
  console.log(`Se borrarían (${ids.length}): ${aBorrar.map((c) => c.nombre_negocio).join(', ') || '—'}`)
  for (const tabla of BORRADO) {
    const n = (respaldo[tabla] as { cliente_id?: string }[]).filter((f) => f.cliente_id && ids.includes(f.cliente_id)).length
    if (n) console.log(`  ${tabla}: ${n}`)
  }
  if (!confirmar) {
    console.log('En seco. Repite con --confirmar para borrar.')
    return
  }
  if (ids.length === 0) return

  const encargos = (respaldo.encargos as { id: string; cliente_id: string | null }[])
    .filter((e) => e.cliente_id && ids.includes(e.cliente_id))
    .map((e) => e.id)
  if (encargos.length) {
    const { error } = await supabase.from('encargo_adjuntos').delete().in('encargo_id', encargos)
    if (error) throw new Error(`encargo_adjuntos: ${error.message}`)
  }
  for (const tabla of BORRADO) {
    const { error } = await supabase.from(tabla).delete().in('cliente_id', ids)
    if (error) throw new Error(`${tabla}: ${error.message}`)
  }

  const usuariosCliente = (respaldo.usuarios as { user_id: string; rol: string; cliente_id: string | null }[])
    .filter((u) => u.rol === 'cliente' && u.cliente_id && ids.includes(u.cliente_id))
  for (const u of usuariosCliente) {
    const { error } = await supabase.auth.admin.deleteUser(u.user_id)
    if (error) throw new Error(`deleteUser ${u.user_id}: ${error.message}`)
  }

  const { error } = await supabase.from('clientes').delete().in('id', ids)
  if (error) throw new Error(`clientes: ${error.message}`)
  console.log(`Listo: ${ids.length} clientes borrados.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
