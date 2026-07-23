import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const RESUMEN_MOCK = { exito: true, campaniasActualizadas: 3, errores: [] }

const sincronizarMetaMock = vi.fn().mockResolvedValue(RESUMEN_MOCK)

vi.mock('@/lib/meta/sync', () => ({
  sincronizarMeta: (...args: unknown[]) => sincronizarMetaMock(...args),
}))

const { GET } = await import('../route')

const SECRETO = 'secreto-de-prueba'

function crearRequest(header?: string) {
  return new NextRequest('http://localhost/api/cron/meta-sync', {
    headers: header ? { authorization: header } : undefined,
  })
}

describe('GET /api/cron/meta-sync', () => {
  beforeEach(() => {
    sincronizarMetaMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sin header Authorization: 401 y no llama a sincronizarMeta', async () => {
    vi.stubEnv('CRON_SECRET', SECRETO)

    const response = await GET(crearRequest())

    expect(response.status).toBe(401)
    expect(sincronizarMetaMock).not.toHaveBeenCalled()
  })

  it('con bearer correcto: 200, body = resumen, llama sincronizarMeta con "cron"', async () => {
    vi.stubEnv('CRON_SECRET', SECRETO)

    const response = await GET(crearRequest(`Bearer ${SECRETO}`))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(RESUMEN_MOCK)
    expect(sincronizarMetaMock).toHaveBeenCalledTimes(1)
    expect(sincronizarMetaMock).toHaveBeenCalledWith('cron')
  })

  it('con bearer incorrecto: 401', async () => {
    vi.stubEnv('CRON_SECRET', SECRETO)

    const response = await GET(crearRequest('Bearer valor-equivocado'))

    expect(response.status).toBe(401)
    expect(sincronizarMetaMock).not.toHaveBeenCalled()
  })

  it('sin CRON_SECRET configurado: 401 aunque llegue un header (fail-closed)', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(crearRequest(`Bearer ${SECRETO}`))

    expect(response.status).toBe(401)
    expect(sincronizarMetaMock).not.toHaveBeenCalled()
  })
})
