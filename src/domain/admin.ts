import type { IsoDateTime } from './common'

export type AdminStatus = 'active' | 'suspended'
export type SessionRisk = 'normal' | 'attention' | 'high'

export interface Administrator {
  id: string
  name: string
  emailMasked: string
  role: 'super_admin'
  status: AdminStatus
  twoFactorEnabled: boolean
  lastLoginAt: IsoDateTime
}

export interface LoginSession {
  id: string
  adminId: string
  device: string
  browser: string
  location: string
  ipMasked: string
  risk: SessionRisk
  current: boolean
  createdAt: IsoDateTime
  lastActiveAt: IsoDateTime
}
