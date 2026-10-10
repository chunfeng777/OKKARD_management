import type { IsoDateTime, Permission } from './common'

export type AuthenticationLevel = 'password' | 'two_factor'

export interface AdminIdentity {
  id: string
  name: string
  emailMasked: string
  role: 'super_admin'
  permissions: Permission[]
}

export interface AdminSession {
  token: string
  admin: AdminIdentity
  authenticationLevel: AuthenticationLevel
  expiresAt: IsoDateTime
}

export interface LoginCommand {
  account: string
  password: string
}

export interface TwoFactorCommand {
  challengeId: string
  code: string
}

export interface AuthChallenge {
  challengeId: string
  destinationMasked: string
  expiresAt: IsoDateTime
}

export type AuthState =
  | { status: 'anonymous' }
  | { status: 'two_factor_required'; challenge: AuthChallenge }
  | { status: 'authenticated'; session: AdminSession }
