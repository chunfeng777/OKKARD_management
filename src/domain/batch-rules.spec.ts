import { describe, expect, it } from 'vitest'
import type { BlindBoxBatch } from './blind-box'
import {
  canTransitionBatch,
  isBatchCoreLocked,
  previewProbability,
  validateBatch,
} from './batch-rules'

const localized = '卡牌奖项'

describe('batch domain rules', () => {
  it('only permits declared transitions', () => {
    expect(canTransitionBatch('draft', 'pending_review')).toBe(true)
    expect(canTransitionBatch('pending_review', 'on_sale')).toBe(false)
    expect(canTransitionBatch('on_sale', 'draft')).toBe(false)
  })

  it('uses remaining quota for deterministic preview', () => {
    expect(previewProbability(3, 12)).toBe(0.25)
    expect(previewProbability(1, 0)).toBe(0)
  })

  it('validates explicit uniqueness and template coverage', () => {
    const pool: BlindBoxBatch['pool'] = [
      {
        id: '1',
        tier: 'A',
        kind: 'explicit_card',
        label: localized,
        quota: 2,
        remaining: 2,
        lockedCoin: 4000,
        physicalCardIds: ['P1', 'P2'],
      },
      {
        id: '2',
        tier: 'B',
        kind: 'template',
        label: localized,
        quota: 3,
        remaining: 3,
        lockedCoin: 2000,
        physicalCardIds: [],
        templatePoolId: 'TP1',
      },
    ]
    const result = validateBatch(
      { initialStock: 5, scheduledAt: '2026-09-20T00:00:00Z', pool },
      { TP1: 3 },
    )
    expect(result.every((item) => item.passed)).toBe(true)
  })

  it('rejects duplicate physical cards and aggregates template demand', () => {
    const pool: BlindBoxBatch['pool'] = [
      {
        id: '1',
        tier: 'S',
        kind: 'explicit_card',
        label: localized,
        quota: 1,
        remaining: 1,
        lockedCoin: 4000,
        physicalCardIds: ['P1'],
      },
      {
        id: '2',
        tier: 'A',
        kind: 'explicit_card',
        label: localized,
        quota: 1,
        remaining: 1,
        lockedCoin: 3000,
        physicalCardIds: ['P1'],
      },
      {
        id: '3',
        tier: 'B',
        kind: 'template',
        label: localized,
        quota: 2,
        remaining: 2,
        lockedCoin: 2000,
        physicalCardIds: [],
        templatePoolId: 'TP1',
      },
      {
        id: '4',
        tier: 'B',
        kind: 'template',
        label: localized,
        quota: 2,
        remaining: 2,
        lockedCoin: 2000,
        physicalCardIds: [],
        templatePoolId: 'TP1',
      },
    ]
    const result = validateBatch(
      { initialStock: 6, scheduledAt: '2026-09-20T00:00:00Z', pool },
      { TP1: 3 },
      new Set(['P1']),
    )
    expect(result.find((item) => item.key === 'explicit_inventory')?.passed).toBe(false)
    expect(result.find((item) => item.key === 'template_coverage')?.passed).toBe(false)
  })

  it('locks core fields forever after first publication', () => {
    expect(isBatchCoreLocked({ firstPublishedAt: '2026-09-18T00:00:00Z' } as BlindBoxBatch)).toBe(
      true,
    )
  })
})
