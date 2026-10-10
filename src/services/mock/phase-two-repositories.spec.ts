import { describe, expect, it } from 'vitest'
import { RepositoryError } from '../contracts'
import { blindBoxes, inventory } from './phase-two-repositories'

const context = (suffix: string) => ({
  requestId: `req_${suffix}`,
  idempotencyKey: `idem_${suffix}`,
  requestedAt: '2026-09-18T10:00:00+08:00',
})

describe('phase two mock repositories', () => {
  it('blocks editing core configuration after a batch has gone live', async () => {
    const batch = await blindBoxes.getBatch('BAT-260915-003')
    batch.unitPriceCoin = 1
    await expect(blindBoxes.saveDraft(batch, context('locked'))).rejects.toMatchObject({
      code: 'BATCH_CORE_LOCKED',
    })
  })

  it('blocks a creator from reviewing their own submitted batch', async () => {
    await blindBoxes.submitReview('BAT-260920-001', '提交另一管理员审核', context('submit'))
    try {
      await blindBoxes.reviewBatch(
        'BAT-260920-001',
        { decision: 'approve', reason: '尝试自审应被拒绝', verificationCode: '123456' },
        context('self-review'),
      )
      throw new Error('Expected self review to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(RepositoryError)
      expect((error as RepositoryError).code).toBe('BATCH_SELF_REVIEW_FORBIDDEN')
    }
  })

  it('allows another administrator to approve a valid pending batch', async () => {
    const reviewed = await blindBoxes.reviewBatch(
      'BAT-260919-002',
      { decision: 'approve', reason: '库存与模板覆盖均已复核', verificationCode: '123456' },
      context('approve'),
    )
    expect(reviewed.status).toBe('scheduled')
    expect(reviewed.reviewerId).toBe('ADM-0001')
    const events = await blindBoxes.listBatchEvents(reviewed.id)
    expect(events.some((event) => event.requestId === 'req_approve')).toBe(true)
  })

  it('creates, updates and deletes a zero-inventory card style through the repository boundary', async () => {
    const created = await inventory.saveCardStyle(
      {
        id: '',
        name: '测试卡片款式',
        category: '宝可梦',
        ipTag: 'Pokémon',
        setName: 'Test Set',
        rarity: 'SR',
        valueGrade: 'A',
        marketValueUsd: 88,
        coinValue: 880,
        referenceImageUrl: 'https://example.com/card.webp',
        physicalCount: 99,
        availableCount: 99,
        updatedAt: '2026-09-18T10:00:00+08:00',
      },
      context('style-create'),
    )
    expect(created.id).toMatch(/^STY-PKM-/)
    expect(created.physicalCount).toBe(0)

    created.coinValue = 900
    const updated = await inventory.saveCardStyle(created, context('style-update'))
    expect(updated.coinValue).toBe(900)

    await inventory.deleteCardStyle(
      created.id,
      '测试款式无库存，确认删除',
      '123456',
      context('style-delete'),
    )
    await expect(inventory.getCardStyle(created.id)).rejects.toMatchObject({
      code: 'STYLE_NOT_FOUND',
    })
  })

  it('blocks deletion when a card style has physical inventory', async () => {
    await expect(
      inventory.deleteCardStyle(
        'STY-PKM-001',
        '已有实体库存，不应允许删除',
        '123456',
        context('style-blocked'),
      ),
    ).rejects.toMatchObject({ code: 'STYLE_HAS_INVENTORY' })
  })

  it('filters blind boxes by type and links a new box to its configuration draft', async () => {
    const filtered = await blindBoxes.listProducts({
      page: 1,
      pageSize: 20,
      type: '主题精选',
    })
    expect(filtered.items.every((item) => item.type === '主题精选')).toBe(true)

    const product = await blindBoxes.saveProduct(
      {
        id: '',
        slug: 'test-workflow-box',
        name: '三层流程测试盲盒',
        type: '流程测试',
        description: '验证新增盲盒后进入卡片配置。',
        tags: ['测试'],
        coverUrl: '',
        galleryUrls: [],
        seoTitle: '三层流程测试盲盒',
        enabled: false,
        updatedAt: '2026-09-18T10:00:00+08:00',
      },
      context('product-workflow'),
    )
    const draft = await blindBoxes.createDraft(product.id, context('product-draft'))
    expect(draft.productId).toBe(product.id)
    expect(draft.status).toBe('draft')
  })
})
