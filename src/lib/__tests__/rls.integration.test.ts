// @vitest-environment node
/**
 * Test de integracion RLS (aislamiento multi-tenant) — compuerta critica de seguridad.
 *
 * Corre contra el proyecto Supabase real usando credenciales seed:
 *   - demo@tacoselpatron.mx  (rol cliente, negocio "Tacos El Patron")
 *   - admin@topdigital.mx    (rol admin)
 *
 * IMPORTANTE: las denegaciones de SELECT por RLS regresan FILAS VACIAS, no errores.
 * Por eso las aserciones de lectura son sobre estado (conteos, ids), nunca sobre excepciones.
 *
 * Ejecutar con: npm run test:rls  (excluido del `npm test` normal)
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

loadEnv({ path: path.resolve(__dirname, '../../../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY

const DEMO_EMAIL = 'demo@tacoselpatron.mx'
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? ''
const ADMIN_EMAIL = 'admin@topdigital.mx'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? ''

// Marcadores unicos para poder limpiar de forma determinista en afterAll
const MARKER_LEAD_CROSS_TENANT = 'RLS-TEST cross-tenant lead (no debe existir)'
const MARKER_LEAD_AGENCIA = 'RLS-TEST lead senuelo de la agencia'
const MARKER_SEGUIMIENTO_NOTA = 'RLS-TEST seguimiento original'
const MARKER_SEGUIMIENTO_HACK = 'RLS-TEST intento de mutacion'

function makeClient(key: string): SupabaseClient {
  return createClient(SUPABASE_URL as string, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Decodifica el payload del JWT (sin verificar firma; solo para leer claims en el test). */
function jwtClaims(accessToken: string): Record<string, unknown> {
  const payload = accessToken.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

let demo: SupabaseClient // sesion tenant (Tacos El Patron), key publishable
let admin: SupabaseClient // sesion admin, key publishable
let svc: SupabaseClient // SOLO verificacion/cleanup: secret key, bypasea RLS

let demoClienteId: string // cliente_id del claim JWT de demo
let agenciaClienteId: string // id del cliente es_agencia (el "otro" tenant)
let agenciaLeadId: string // lead senuelo del otro tenant: demo NUNCA debe verlo

beforeAll(async () => {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) {
    throw new Error(
      'Faltan variables en .env.local: se requieren NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY y SUPABASE_SECRET_KEY',
    )
  }

  demo = makeClient(PUBLISHABLE_KEY)
  admin = makeClient(PUBLISHABLE_KEY)
  svc = makeClient(SECRET_KEY)

  const demoLogin = await demo.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (demoLogin.error || !demoLogin.data.session) {
    throw new Error(
      `Login de ${DEMO_EMAIL} fallo: ${demoLogin.error?.message ?? 'sin sesion'}. Verifica el seed (npm run seed).`,
    )
  }

  const adminLogin = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  if (adminLogin.error || !adminLogin.data.session) {
    throw new Error(
      `Login de ${ADMIN_EMAIL} fallo: ${adminLogin.error?.message ?? 'sin sesion'}. Verifica el seed (npm run seed).`,
    )
  }

  const claims = jwtClaims(demoLogin.data.session.access_token)
  if (typeof claims.cliente_id !== 'string' || !claims.cliente_id) {
    throw new Error(
      'El JWT de demo no trae claim cliente_id. Habilita el Custom Access Token Hook (migracion 0003) en el dashboard.',
    )
  }
  demoClienteId = claims.cliente_id

  // El id de la agencia (el otro tenant) se obtiene con la sesion ADMIN via RLS normal
  const { data: agencia, error: agenciaError } = await admin
    .from('clientes')
    .select('id')
    .eq('es_agencia', true)
    .single()
  if (agenciaError || !agencia) {
    throw new Error(`No se pudo obtener el cliente agencia como admin: ${agenciaError?.message}`)
  }
  agenciaClienteId = agencia.id

  if (agenciaClienteId === demoClienteId) {
    throw new Error('Precondicion rota: el cliente_id de demo no debe ser el de la agencia')
  }

  // Lead senuelo en el OTRO tenant (secret key, bypasea RLS): hace falsificable el
  // aislamiento de lectura — si la politica SELECT de leads regresara a USING(true),
  // demo veria este lead y el test (a) fallaria.
  const { data: senuelo, error: senueloError } = await svc
    .from('leads')
    .insert({ cliente_id: agenciaClienteId, nombre: MARKER_LEAD_AGENCIA, fuente: 'organico' })
    .select('id')
    .single()
  if (senueloError || !senuelo) {
    throw new Error(`No se pudo insertar el lead senuelo de la agencia: ${senueloError?.message}`)
  }
  agenciaLeadId = senuelo.id
}, 30_000)

afterAll(async () => {
  // Cleanup SOLO con el cliente de servicio (secret key), para que el test sea re-ejecutable
  if (svc) {
    await svc.from('seguimientos').delete().in('nota', [MARKER_SEGUIMIENTO_NOTA, MARKER_SEGUIMIENTO_HACK])
    // Senuelo de la agencia + defensivo: el lead cross-tenant de (c) no deberia existir
    await svc.from('leads').delete().in('nombre', [MARKER_LEAD_CROSS_TENANT, MARKER_LEAD_AGENCIA])
  }
  await demo?.auth.signOut()
  await admin?.auth.signOut()
}, 30_000)

describe('RLS aislamiento multi-tenant', () => {
  it('(a) demo lee leads: exactamente los de su tenant, y NO ve el senuelo de la agencia', async () => {
    // Conjunto esperado derivado en runtime (secret key, bypasea RLS): robusto a seeds futuros
    const { data: expected, error: expectedError } = await svc
      .from('leads')
      .select('id')
      .eq('cliente_id', demoClienteId)
    expect(expectedError).toBeNull()
    expect(expected!.length).toBeGreaterThanOrEqual(1)
    const expectedIds = expected!.map((r) => r.id).sort()

    const { data, error } = await demo.from('leads').select('id, cliente_id')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    // Igualdad de conjuntos: ni una fila menos (RLS no recorta de mas) ni una de mas (no hay fuga)
    expect(data!.map((r) => r.id).sort()).toEqual(expectedIds)
    for (const row of data!) {
      expect(row.cliente_id).toBe(demoClienteId)
    }
    // Detector de fuga explicito: el lead senuelo del otro tenant NO aparece
    expect(data!.some((r) => r.id === agenciaLeadId)).toBe(false)
  })

  it('(b) CRITICO: demo NO ve campania_finanzas (0 filas, sin error)', async () => {
    const { data, error } = await demo.from('campania_finanzas').select('*')
    // Denegacion RLS de SELECT = resultado vacio, no excepcion
    expect(error).toBeNull()
    // Si esto regresa filas, hay fuga de datos financieros sensibles: BUG DE SEGURIDAD
    expect(data).toEqual([])
  })

  it('(c) demo no puede insertar un lead con el cliente_id de la agencia', async () => {
    const { error } = await demo.from('leads').insert({
      cliente_id: agenciaClienteId,
      nombre: MARKER_LEAD_CROSS_TENANT,
      fuente: 'organico',
    })
    // La politica WITH CHECK debe rechazar el insert
    expect(error).not.toBeNull()

    // VERIFICACION (secret key, bypasea RLS): el lead no debe existir en absoluto
    const { data: check, error: checkError } = await svc
      .from('leads')
      .select('id')
      .eq('nombre', MARKER_LEAD_CROSS_TENANT)
    expect(checkError).toBeNull()
    expect(check).toEqual([])
  })

  it('(d) demo no puede reasignar cliente_id de su lead (columna revocada)', async () => {
    const { data: own, error: ownError } = await demo
      .from('leads')
      .select('id, cliente_id')
      .limit(1)
    expect(ownError).toBeNull()
    expect(own!.length).toBe(1)
    const leadId = own![0].id

    const { error: updError } = await demo
      .from('leads')
      .update({ cliente_id: agenciaClienteId })
      .eq('id', leadId)
    // UPDATE sobre columna sin grant => 42501 permission denied
    expect(updError).not.toBeNull()
    expect(updError!.code).toBe('42501')

    // VERIFICACION (secret key): el cliente_id sigue intacto
    const { data: after, error: afterError } = await svc
      .from('leads')
      .select('cliente_id')
      .eq('id', leadId)
      .single()
    expect(afterError).toBeNull()
    expect(after!.cliente_id).toBe(demoClienteId)
  })

  it('(e) admin ve TODOS los leads (ambos tenants, incluye el senuelo) y todas las finanzas', async () => {
    // Universo esperado derivado en runtime (secret key): robusto a seeds futuros
    const { data: allLeads, error: allLeadsError } = await svc.from('leads').select('id')
    expect(allLeadsError).toBeNull()
    const allLeadIds = allLeads!.map((r) => r.id).sort()

    const { data: leads, error: leadsError } = await admin.from('leads').select('id, cliente_id')
    expect(leadsError).toBeNull()
    // Igualdad de conjuntos: admin ve exactamente lo mismo que el bypass de RLS
    expect(leads!.map((r) => r.id).sort()).toEqual(allLeadIds)
    // Cross-tenant explicito: el senuelo de la agencia y los leads de Tacos estan presentes
    expect(leads!.some((l) => l.id === agenciaLeadId)).toBe(true)
    expect(leads!.some((l) => l.cliente_id === demoClienteId)).toBe(true)

    const { data: allFinanzas, error: allFinanzasError } = await svc
      .from('campania_finanzas')
      .select('campania_id')
    expect(allFinanzasError).toBeNull()
    expect(allFinanzas!.length).toBeGreaterThanOrEqual(1)
    const allFinanzasIds = allFinanzas!.map((r) => r.campania_id).sort()

    const { data: finanzas, error: finanzasError } = await admin
      .from('campania_finanzas')
      .select('campania_id')
    expect(finanzasError).toBeNull()
    expect(finanzas!.map((r) => r.campania_id).sort()).toEqual(allFinanzasIds)

    // admin tambien ve todos los clientes (conjunto derivado en runtime)
    const { data: allClientes, error: allClientesError } = await svc.from('clientes').select('id')
    expect(allClientesError).toBeNull()
    const { data: clientes, error: clientesError } = await admin.from('clientes').select('id')
    expect(clientesError).toBeNull()
    expect(clientes!.map((r) => r.id).sort()).toEqual(allClientes!.map((r) => r.id).sort())
  })

  it('(f) demo lee clientes: solo su propia fila', async () => {
    const { data, error } = await demo.from('clientes').select('id')
    expect(error).toBeNull()
    expect(data!.length).toBe(1)
    expect(data![0].id).toBe(demoClienteId)
  })

  it('(g) demo inserta seguimiento propio; el update posterior NO persiste (inmutable)', async () => {
    const { data: own, error: ownError } = await demo.from('leads').select('id').limit(1)
    expect(ownError).toBeNull()
    const leadId = own![0].id

    const { data: seg, error: insError } = await demo
      .from('seguimientos')
      .insert({
        lead_id: leadId,
        cliente_id: demoClienteId,
        nota: MARKER_SEGUIMIENTO_NOTA,
      })
      .select('id, nota')
      .single()
    expect(insError).toBeNull()
    expect(seg!.nota).toBe(MARKER_SEGUIMIENTO_NOTA)

    // Intento de mutacion: sin politica de UPDATE, RLS filtra 0 filas (sin error),
    // o bien un revoke futuro produciria error. Cualquiera de las dos = denegado.
    const { data: updData, error: updError } = await demo
      .from('seguimientos')
      .update({ nota: MARKER_SEGUIMIENTO_HACK })
      .eq('id', seg!.id)
      .select('id')
    const denegado = updError !== null || (updData ?? []).length === 0
    expect(denegado).toBe(true)

    // VERIFICACION (secret key): la nota sigue siendo la original
    const { data: after, error: afterError } = await svc
      .from('seguimientos')
      .select('nota')
      .eq('id', seg!.id)
      .single()
    expect(afterError).toBeNull()
    expect(after!.nota).toBe(MARKER_SEGUIMIENTO_NOTA)
  })
})
