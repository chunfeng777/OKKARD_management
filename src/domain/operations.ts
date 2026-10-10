import type { IsoDateTime, OperationContext, PageQuery } from './common'

export type BusinessModuleKey =
  | 'users'
  | 'riskEvents'
  | 'coinLedger'
  | 'recharges'
  | 'rechargeTiers'
  | 'refunds'
  | 'chargebacks'
  | 'adjustments'
  | 'drawOrders'
  | 'anomalies'
  | 'recycles'
  | 'shipments'
  | 'pickLists'
  | 'returns'
  | 'exceptions'
  | 'banners'
  | 'homeSections'
  | 'faq'
  | 'staticPages'
  | 'localization'
  | 'contentRelease'
  | 'tickets'
  | 'notificationTemplates'
  | 'deliveryRecords'
  | 'loginRecords'
  | 'systemSettings'

export interface BusinessField {
  label: string
  value: string
  copyable?: boolean
  sensitive?: boolean
}

export interface BusinessSection {
  key: string
  title: string
  fields: BusinessField[]
}

export interface BusinessTimelineEvent {
  id: string
  action: string
  operator: string
  reason: string
  result: string
  requestId: string
  createdAt: IsoDateTime
}

export interface BusinessAction {
  key: string
  label: string
  targetStatus?: string
  tone: 'primary' | 'warning' | 'danger' | 'neutral'
  confirmationWord: string
  consequence: string
}

export interface BusinessRecord {
  id: string
  module: BusinessModuleKey
  title: string
  secondary: string
  status: string
  summaryA: string
  summaryB: string
  summaryC: string
  risk: 'normal' | 'attention' | 'high'
  requestId: string
  idempotencyKey: string
  updatedAt: IsoDateTime
  sections: BusinessSection[]
  timeline: BusinessTimelineEvent[]
  actions: BusinessAction[]
}

export interface BusinessQuery extends PageQuery {
  status?: string
  risk?: string
}

export interface BusinessActionCommand {
  action: string
  reason: string
  verificationCode: string
  context: OperationContext
}

export interface BusinessSaveCommand {
  sections: BusinessSection[]
  reason: string
  context: OperationContext
}
