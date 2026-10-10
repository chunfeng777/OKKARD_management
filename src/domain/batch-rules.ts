import type { BlindBoxBatch, BatchValidationItem } from './blind-box'
import type { BatchStatus } from './states'

const transitions: Record<BatchStatus, BatchStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['draft', 'scheduled'],
  scheduled: ['on_sale', 'archived'],
  on_sale: ['paused', 'sold_out'],
  paused: ['on_sale', 'archived'],
  sold_out: ['archived'],
  archived: [],
}

export const canTransitionBatch = (from: BatchStatus, to: BatchStatus) =>
  transitions[from].includes(to)

export const isBatchCoreLocked = (batch: BlindBoxBatch) => Boolean(batch.firstPublishedAt)

export const previewProbability = (remaining: number, totalRemaining: number) =>
  totalRemaining > 0 ? remaining / totalRemaining : 0

export const validateBatch = (
  batch: Pick<BlindBoxBatch, 'initialStock' | 'scheduledAt' | 'pool'>,
  templateAvailability: Record<string, number>,
  validPhysicalCardIds?: Set<string>,
): BatchValidationItem[] => {
  const totalQuota = batch.pool.reduce((sum, item) => sum + item.quota, 0)
  const languagesComplete = batch.pool.every((item) => item.label.trim().length > 0)
  const explicitItems = batch.pool.filter((item) => item.kind === 'explicit_card')
  const explicitIds = explicitItems.flatMap((item) => item.physicalCardIds)
  const explicitCovered =
    explicitItems.every((item) => item.physicalCardIds.length === item.quota) &&
    new Set(explicitIds).size === explicitIds.length &&
    (!validPhysicalCardIds || explicitIds.every((id) => validPhysicalCardIds.has(id)))
  const templateRequirements = batch.pool
    .filter((item) => item.kind === 'template')
    .reduce<Record<string, number>>((result, item) => {
      if (item.templatePoolId)
        result[item.templatePoolId] = (result[item.templatePoolId] ?? 0) + item.quota
      return result
    }, {})
  const templateItems = batch.pool.filter((item) => item.kind === 'template')
  const templatesCovered =
    templateItems.every((item) => Boolean(item.templatePoolId)) &&
    Object.entries(templateRequirements).every(
      ([poolId, quota]) => (templateAvailability[poolId] ?? 0) >= quota,
    )
  return [
    { key: 'languages', passed: languagesComplete, message: 'languages' },
    {
      key: 'pool_total',
      passed: totalQuota === batch.initialStock && totalQuota > 0,
      message: 'pool_total',
    },
    { key: 'explicit_inventory', passed: explicitCovered, message: 'explicit_inventory' },
    { key: 'template_coverage', passed: templatesCovered, message: 'template_coverage' },
    { key: 'schedule', passed: Boolean(batch.scheduledAt), message: 'schedule' },
  ]
}
