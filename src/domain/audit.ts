import type { IsoDateTime } from './common'

export type AuditResult = 'succeeded' | 'failed' | 'denied'
export type AuditAction =
  | 'auth.login'
  | 'auth.two_factor_verified'
  | 'auth.logout'
  | 'session.view'
  | 'session.revoke'
  | 'sensitive.view'
  | 'data.export'

export interface AuditLog {
  id: string
  adminId: string
  adminName: string
  action: AuditAction
  objectType: string
  objectId: string
  ipMasked: string
  device: string
  reason: string
  result: AuditResult
  requestId: string
  createdAt: IsoDateTime
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}
