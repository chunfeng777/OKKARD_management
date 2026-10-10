import type { AdminSession, AuthState } from '@/domain/auth'
import { describe, expect, it } from 'vitest'
import { resolveAccess } from './access'

const session: AdminSession = {
  token: 'test',
  authenticationLevel: 'two_factor',
  expiresAt: '2026-09-18T00:00:00Z',
  admin: {
    id: 'ADM-TEST',
    name: 'Test',
    emailMasked: 'te***@example.com',
    role: 'super_admin',
    permissions: ['dashboard.view'],
  },
}

describe('resolveAccess', () => {
  it('redirects anonymous administrators to login and preserves the target', () => {
    const result = resolveAccess({ status: 'anonymous' }, { fullPath: '/system/audit-logs' })
    expect(result).toEqual({
      allow: false,
      redirect: 'login',
      query: { redirect: '/system/audit-logs' },
    })
  })

  it('requires two-factor verification before protected routes', () => {
    const state: AuthState = {
      status: 'two_factor_required',
      challenge: {
        challengeId: 'challenge',
        destinationMasked: '***',
        expiresAt: '2026-09-18T00:00:00Z',
      },
    }
    expect(resolveAccess(state, { fullPath: '/dashboard' })).toEqual({
      allow: false,
      redirect: 'two-factor',
      query: { redirect: '/dashboard' },
    })
  })

  it('denies authenticated administrators without the requested permission', () => {
    expect(
      resolveAccess(
        { status: 'authenticated', session },
        { fullPath: '/system/audit-logs', permission: 'audit.view' },
      ),
    ).toEqual({ allow: false, redirect: 'forbidden' })
  })

  it('allows a fully verified administrator with permission', () => {
    expect(
      resolveAccess(
        { status: 'authenticated', session },
        { fullPath: '/dashboard', permission: 'dashboard.view' },
      ),
    ).toEqual({ allow: true })
  })
})
