import { describe, expect, it } from 'vitest'

import type { CampaniaMeta, InsightCampania } from '../tipos'
import { idsParaArchivar, prepararCampanias } from '../sync'

const AHORA = '2026-07-22T11:30:00.000Z'

describe('prepararCampanias', () => {
  it('une campania con su insight por id/campaign_id', () => {
    const campanias: CampaniaMeta[] = [
      {
        id: '111',
        name: 'CTWA Mayo',
        effective_status: 'ACTIVE',
        start_time: '2026-05-02T10:19:05-0600',
      },
    ]
    const insights: InsightCampania[] = [
      {
        campaign_id: '111',
        spend: '581.11',
        actions: [
          {
            action_type: 'onsite_conversion.messaging_conversation_started_7d',
            value: '38',
          },
        ],
      },
    ]

    const { filas, gastos } = prepararCampanias(
      'cli-1',
      campanias,
      insights,
      AHORA
    )

    expect(filas).toEqual([
      {
        cliente_id: 'cli-1',
        meta_campaign_id: '111',
        nombre: 'CTWA Mayo',
        plataforma: 'Meta',
        estado: 'activa',
        fecha_inicio: '2026-05-02',
        leads_generados: 38,
        sincronizada_en: AHORA,
      },
    ])
    expect(gastos.get('111')).toBe(581.11)
  })

  it('campania sin insight: 0 leads y gasto 0 en el Map', () => {
    const campanias: CampaniaMeta[] = [
      { id: '222', name: 'Sin datos', effective_status: 'PAUSED' },
    ]

    const { filas, gastos } = prepararCampanias('cli-1', campanias, [], AHORA)

    expect(filas[0].leads_generados).toBe(0)
    expect(gastos.get('222')).toBe(0)
  })

  it('aplica el mapeo de estado (ACTIVE→activa, ARCHIVED→archivada)', () => {
    const campanias: CampaniaMeta[] = [
      { id: '1', name: 'A', effective_status: 'ACTIVE' },
      { id: '2', name: 'B', effective_status: 'ARCHIVED' },
    ]

    const { filas } = prepararCampanias('cli-1', campanias, [], AHORA)

    expect(filas.map((f) => f.estado)).toEqual(['activa', 'archivada'])
  })

  it('deriva fecha_inicio de start_time y usa null cuando falta', () => {
    const campanias: CampaniaMeta[] = [
      {
        id: '1',
        name: 'Con fecha',
        effective_status: 'ACTIVE',
        start_time: '2026-05-02T10:19:05-0600',
      },
      { id: '2', name: 'Sin fecha', effective_status: 'PAUSED' },
    ]

    const { filas } = prepararCampanias('cli-1', campanias, [], AHORA)

    expect(filas[0].fecha_inicio).toBe('2026-05-02')
    expect(filas[1].fecha_inicio).toBeNull()
  })

  it('estampa sincronizada_en = ahora en todas las filas', () => {
    const campanias: CampaniaMeta[] = [
      { id: '1', name: 'A', effective_status: 'ACTIVE' },
      { id: '2', name: 'B', effective_status: 'PAUSED' },
    ]

    const { filas } = prepararCampanias('cli-1', campanias, [], AHORA)

    expect(filas.every((f) => f.sincronizada_en === AHORA)).toBe(true)
  })

  it('el Map de gastos trae spend parseado a numero', () => {
    const campanias: CampaniaMeta[] = [
      { id: '9', name: 'Gasto', effective_status: 'ACTIVE' },
    ]
    const insights: InsightCampania[] = [
      { campaign_id: '9', spend: '581.11' },
    ]

    const { gastos } = prepararCampanias('cli-1', campanias, insights, AHORA)

    expect(gastos.get('9')).toBe(581.11)
  })
})

describe('idsParaArchivar', () => {
  const recibidas: CampaniaMeta[] = [
    { id: '111', name: 'A', effective_status: 'ACTIVE' },
    { id: '222', name: 'B', effective_status: 'PAUSED' },
  ]

  it('regresa solo las filas ausentes de recibidas', () => {
    const existentes = [
      { id: 'db-1', meta_campaign_id: '111' },
      { id: 'db-2', meta_campaign_id: '999' },
    ]
    expect(idsParaArchivar(existentes, recibidas)).toEqual(['db-2'])
  })

  it('regresa vacio cuando todas estan presentes', () => {
    const existentes = [
      { id: 'db-1', meta_campaign_id: '111' },
      { id: 'db-2', meta_campaign_id: '222' },
    ]
    expect(idsParaArchivar(existentes, recibidas)).toEqual([])
  })

  it('ignora filas con meta_campaign_id null (defensivo)', () => {
    const existentes = [
      { id: 'db-1', meta_campaign_id: null },
      { id: 'db-2', meta_campaign_id: '999' },
    ]
    expect(idsParaArchivar(existentes, recibidas)).toEqual(['db-2'])
  })
})
