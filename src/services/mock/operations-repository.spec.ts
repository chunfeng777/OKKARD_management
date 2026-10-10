import { describe, expect, it } from 'vitest'
import { operations } from './operations-repository'

describe('operations repository', () => {
  it('uses server pagination and compound filters', async () => {
    const result = await operations.listRecords('recharges', {
      page: 1,
      pageSize: 20,
      keyword: 'USDT',
      status: 'manual_review',
      risk: 'attention',
    })
    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe('RCG-000002')
  })

  it('requires a reason and two-factor code for a state transition', async () => {
    await expect(
      operations.executeAction('shipments', 'SHP-000001', {
        action: 'approve',
        reason: '审核通过，进入模板分配',
        verificationCode: '000000',
        context: {
          requestId: 'req-invalid',
          idempotencyKey: 'idem-invalid',
          requestedAt: '2026-09-18T16:00:00+08:00',
        },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TWO_FACTOR' })
  })

  it('advances shipment state and appends an immutable timeline event', async () => {
    const result = await operations.executeAction('shipments', 'SHP-000001', {
      action: 'approve',
      reason: '实体卡与申请信息核对一致',
      verificationCode: '123456',
      context: {
        requestId: 'req-shipment-approve',
        idempotencyKey: 'idem-shipment-approve',
        requestedAt: '2026-09-18T16:02:00+08:00',
      },
    })
    expect(result.status).toBe('pending_template_allocation')
    expect(result.timeline[0]).toMatchObject({ requestId: 'req-shipment-approve' })
    expect(result.actions[0]?.key).toBe('allocate')
  })

  it('prevents overwriting append-only ledger records', async () => {
    const record = await operations.getRecord('coinLedger', 'LED-000001')
    await expect(
      operations.saveRecord('coinLedger', record.id, {
        sections: record.sections,
        reason: '尝试直接覆盖账本数据',
        context: {
          requestId: 'req-ledger-write',
          idempotencyKey: 'idem-ledger-write',
          requestedAt: '2026-09-18T16:04:00+08:00',
        },
      }),
    ).rejects.toMatchObject({ code: 'IMMUTABLE_RECORD' })
  })
})
