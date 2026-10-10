import type { AuthState } from '@/domain/auth'
import type { Permission } from '@/domain/common'

export interface AccessTarget {
  public?: boolean
  requiresTwoFactor?: boolean
  permission?: Permission
  name?: string
  fullPath: string
}

export type AccessDecision =
  | { allow: true }
  | {
      allow: false
      redirect: 'login' | 'two-factor' | 'dashboard' | 'forbidden'
      query?: Record<string, string>
    }

export function resolveAccess(auth: AuthState, target: AccessTarget): AccessDecision {
  if (target.public) {
    if (target.requiresTwoFactor) {
      if (auth.status === 'two_factor_required') return { allow: true }
      if (auth.status === 'authenticated') return { allow: false, redirect: 'dashboard' }
      return { allow: false, redirect: 'login' }
    }
    if (auth.status === 'authenticated' && target.name === 'login') {
      return { allow: false, redirect: 'dashboard' }
    }
    return { allow: true }
  }

  if (auth.status === 'anonymous') {
    return { allow: false, redirect: 'login', query: { redirect: target.fullPath } }
  }
  if (auth.status === 'two_factor_required') {
    return { allow: false, redirect: 'two-factor', query: { redirect: target.fullPath } }
  }
  if (target.permission && !auth.session.admin.permissions.includes(target.permission)) {
    return { allow: false, redirect: 'forbidden' }
  }
  return { allow: true }
}
