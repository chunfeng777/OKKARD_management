export type EntityId = string
export type IsoDateTime = string
export type Permission =
  | 'dashboard.view'
  | 'blindBox.view'
  | 'inventory.view'
  | 'user.view'
  | 'finance.view'
  | 'drawOrder.view'
  | 'fulfillment.view'
  | 'content.view'
  | 'support.view'
  | 'notification.view'
  | 'system.view'
  | 'system.admin.manage'
  | 'system.session.manage'
  | 'audit.view'

export interface PageQuery {
  page: number
  pageSize: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface OperationContext {
  requestId: string
  idempotencyKey: string
  requestedAt: IsoDateTime
}

export type OperationResult<T> =
  | { status: 'succeeded'; data: T; requestId: string }
  | { status: 'processing'; operationId: string; requestId: string }
  | { status: 'unknown'; operationId: string; requestId: string }
