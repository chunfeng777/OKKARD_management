import type { IsoDateTime } from './common'
import type { BatchStatus } from './states'

export interface BlindBoxProduct {
  id: string
  slug: string
  name: string
  type: string
  description: string
  tags: string[]
  coverUrl: string
  galleryUrls: string[]
  seoTitle: string
  saleStartAt?: IsoDateTime
  saleEndAt?: IsoDateTime
  enabled: boolean
  updatedAt: IsoDateTime
}

export type PoolItemKind = 'explicit_card' | 'template'

export interface PoolItem {
  id: string
  styleId?: string
  tier: string
  kind: PoolItemKind
  label: string
  quota: number
  remaining: number
  lockedCoin: number
  physicalCardIds: string[]
  templatePoolId?: string
}

export interface BatchValidationItem {
  key: 'languages' | 'pool_total' | 'explicit_inventory' | 'template_coverage' | 'schedule'
  passed: boolean
  message: string
}

export interface BlindBoxBatch {
  id: string
  productId: string
  productName: string
  status: BatchStatus
  creatorId: string
  reviewerId?: string
  unitPriceCoin: number
  initialStock: number
  remainingStock: number
  scheduledAt?: IsoDateTime
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  firstPublishedAt?: IsoDateTime
  requestId: string
  idempotencyKey: string
  pool: PoolItem[]
  validation: BatchValidationItem[]
}

export interface BatchQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: BatchStatus | ''
  sortBy?: 'updatedAt' | 'remainingStock'
  sortOrder?: 'asc' | 'desc'
}

export interface ProductQuery {
  page: number
  pageSize: number
  keyword?: string
  enabled?: boolean
  type?: string
}

export interface BatchReviewCommand {
  decision: 'approve' | 'reject'
  reason: string
  verificationCode: string
}

export interface IpTag {
  id: string
  name: string
  productCount: number
  enabled: boolean
}

export interface BatchEvent {
  id: string
  batchId: string
  action: string
  operatorId: string
  reason: string
  requestId: string
  createdAt: IsoDateTime
}
