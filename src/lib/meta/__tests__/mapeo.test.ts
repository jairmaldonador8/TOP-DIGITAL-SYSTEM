import { describe, expect, it } from 'vitest'

import { conversacionesDe, estadoDesdeMeta, gastoDe } from '../mapeo'

describe('estadoDesdeMeta', () => {
  it("mapea 'ACTIVE' a 'activa'", () => {
    expect(estadoDesdeMeta('ACTIVE')).toBe('activa')
  })

  it("mapea 'PAUSED', 'CAMPAIGN_PAUSED' y 'ADSET_PAUSED' a 'pausada'", () => {
    expect(estadoDesdeMeta('PAUSED')).toBe('pausada')
    expect(estadoDesdeMeta('CAMPAIGN_PAUSED')).toBe('pausada')
    expect(estadoDesdeMeta('ADSET_PAUSED')).toBe('pausada')
  })

  it("mapea 'ARCHIVED' y 'DELETED' a 'archivada'", () => {
    expect(estadoDesdeMeta('ARCHIVED')).toBe('archivada')
    expect(estadoDesdeMeta('DELETED')).toBe('archivada')
  })

  it("mapea estados intermedios ('IN_PROCESS', 'WITH_ISSUES', 'PENDING_REVIEW') a 'pausada'", () => {
    expect(estadoDesdeMeta('IN_PROCESS')).toBe('pausada')
    expect(estadoDesdeMeta('WITH_ISSUES')).toBe('pausada')
    expect(estadoDesdeMeta('PENDING_REVIEW')).toBe('pausada')
  })
})

describe('conversacionesDe', () => {
  it('lee el action_type de conversaciones de mensajeria iniciadas', () => {
    const actions = [
      { action_type: 'link_click', value: '250' },
      {
        action_type: 'onsite_conversion.messaging_conversation_started_7d',
        value: '38',
      },
    ]
    expect(conversacionesDe(actions)).toBe(38)
  })

  it('regresa 0 si actions es undefined', () => {
    expect(conversacionesDe(undefined)).toBe(0)
  })

  it('regresa 0 si la accion de conversaciones no esta presente', () => {
    const actions = [{ action_type: 'link_click', value: '250' }]
    expect(conversacionesDe(actions)).toBe(0)
  })
})

describe('gastoDe', () => {
  it('parsea el string de spend a numero', () => {
    expect(gastoDe('1234.56')).toBe(1234.56)
  })

  it('regresa 0 si spend es undefined', () => {
    expect(gastoDe(undefined)).toBe(0)
  })

  it('regresa 0 si spend es basura no numerica', () => {
    expect(gastoDe('abc')).toBe(0)
  })
})
