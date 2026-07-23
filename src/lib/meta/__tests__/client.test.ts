import { createHmac } from 'node:crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorMeta, obtenerTodos } from '../client'

const TOKEN = 'token-de-prueba'
const SECRET = 'secreto-de-prueba'

function proofEsperado(token = TOKEN, secret = SECRET) {
  return createHmac('sha256', secret).update(token).digest('hex')
}

function respuesta(body: unknown) {
  return { json: async () => body } as Response
}

beforeEach(() => {
  vi.stubEnv('META_SYSTEM_TOKEN', TOKEN)
  vi.stubEnv('META_APP_SECRET', SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('obtenerTodos', () => {
  it('arma la URL con access_token y appsecret_proof correctos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ data: [{ id: 1 }] }))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    await obtenerTodos('/act_123/campaigns', { fields: 'id,name' }, dormir)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const urlLlamada = new URL(fetchMock.mock.calls[0][0] as string)
    expect(urlLlamada.origin + urlLlamada.pathname).toBe(
      'https://graph.facebook.com/v25.0/act_123/campaigns'
    )
    expect(urlLlamada.searchParams.get('fields')).toBe('id,name')
    expect(urlLlamada.searchParams.get('access_token')).toBe(TOKEN)
    expect(urlLlamada.searchParams.get('appsecret_proof')).toBe(
      proofEsperado()
    )
  })

  it('sigue paging.next a traves de 2 paginas y concatena data', async () => {
    const urlPagina2 =
      'https://graph.facebook.com/v25.0/act_123/campaigns?after=cursor2'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respuesta({ data: [{ id: 1 }], paging: { next: urlPagina2 } })
      )
      .mockResolvedValueOnce(respuesta({ data: [{ id: 2 }] }))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    const filas = await obtenerTodos<{ id: number }>(
      '/act_123/campaigns',
      {},
      dormir
    )

    expect(filas).toEqual([{ id: 1 }, { id: 2 }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toBe(urlPagina2)
  })

  it('no detiene el loop si una pagina trae data vacia pero paging.next existe', async () => {
    const url2 = 'https://graph.facebook.com/v25.0/x?p=2'
    const url3 = 'https://graph.facebook.com/v25.0/x?p=3'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ data: [], paging: { next: url2 } }))
      .mockResolvedValueOnce(
        respuesta({ data: [{ id: 'a' }], paging: { next: url3 } })
      )
      .mockResolvedValueOnce(respuesta({ data: [{ id: 'b' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    const filas = await obtenerTodos('/x', {}, dormir)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(filas).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('reintenta en throttle 80000 durmiendo los minutos indicados y lanza ErrorMeta tras 2 reintentos', async () => {
    const cuerpoError = {
      error: {
        code: 80000,
        message: 'reduced access',
        estimated_time_to_regain_access: 1,
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(respuesta(cuerpoError))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    let error: unknown
    try {
      await obtenerTodos('/act_1/insights', {}, dormir)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(ErrorMeta)
    expect((error as ErrorMeta).codigo).toBe(80000)
    expect(dormir).toHaveBeenCalledTimes(2)
    expect(dormir).toHaveBeenNthCalledWith(1, 60_000)
    expect(dormir).toHaveBeenNthCalledWith(2, 60_000)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('lanza ErrorMeta de inmediato en errores no reintentables (190)', async () => {
    const cuerpoError = {
      error: { code: 190, message: 'Invalid OAuth access token' },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta(cuerpoError))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    let error: unknown
    try {
      await obtenerTodos('/me/adaccounts', {}, dormir)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(ErrorMeta)
    expect((error as ErrorMeta).codigo).toBe(190)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(dormir).not.toHaveBeenCalled()
  })

  it('respeta el tope de espera total (120s) y no duerme si un reintento lo excederia', async () => {
    const cuerpoError = {
      error: {
        code: 80000,
        message: 'reduced access',
        estimated_time_to_regain_access: 5,
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta(cuerpoError))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    let error: unknown
    try {
      await obtenerTodos('/act_1/insights', {}, dormir)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(ErrorMeta)
    expect((error as ErrorMeta).codigo).toBe(80000)
    expect(dormir).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reintenta en errores legacy (17) con backoff exponencial 1s/2s y lanza ErrorMeta tras 2 reintentos', async () => {
    const cuerpoError = {
      error: { code: 17, message: 'User request limit reached' },
    }
    const fetchMock = vi.fn().mockResolvedValue(respuesta(cuerpoError))
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    let error: unknown
    try {
      await obtenerTodos('/act_1/campaigns', {}, dormir)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(ErrorMeta)
    expect((error as ErrorMeta).codigo).toBe(17)
    expect(dormir).toHaveBeenCalledTimes(2)
    expect(dormir).toHaveBeenNthCalledWith(1, 1000)
    expect(dormir).toHaveBeenNthCalledWith(2, 2000)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('lanza un Error (no ErrorMeta) si la respuesta no es JSON valido / fallo de red', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0')
      },
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)
    const dormir = vi.fn(async () => {})

    let error: unknown
    try {
      await obtenerTodos('/act_1/campaigns', {}, dormir)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ErrorMeta)
    expect((error as Error).message.startsWith(
      'Fallo de red o respuesta invalida de Meta'
    )).toBe(true)
    expect(dormir).not.toHaveBeenCalled()
  })

  it('lanza si faltan META_SYSTEM_TOKEN / META_APP_SECRET', async () => {
    vi.unstubAllEnvs()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(obtenerTodos('/me/adaccounts')).rejects.toThrow(
      'Faltan META_SYSTEM_TOKEN / META_APP_SECRET'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
