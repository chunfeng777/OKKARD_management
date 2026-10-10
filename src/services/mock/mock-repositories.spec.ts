import { beforeEach, describe, expect, it } from 'vitest'
import { mockRepositories } from './mock-repositories'

describe('mock repositories', () => {
  beforeEach(() => sessionStorage.clear())

  it('requires two-factor authentication and persists only the verified session', async () => {
    const challenge = await mockRepositories.auth.signIn({
      account: 'admin@okcard.example',
      password: 'Admin123!',
    })
    expect(await mockRepositories.auth.getSession()).toBeNull()

    const session = await mockRepositories.auth.verifyTwoFactor({
      challengeId: challenge.challengeId,
      code: '123456',
    })
    expect(session.authenticationLevel).toBe('two_factor')
    expect((await mockRepositories.auth.getSession())?.admin.id).toBe('ADM-0001')
  })

  it('records session revocation as an append-only audit event', async () => {
    await mockRepositories.system.revokeSession(
      'SES-0821',
      'Device is no longer trusted',
      '123456',
      {
        requestId: 'req-test-revoke',
        idempotencyKey: 'idem-test-revoke',
        requestedAt: '2026-09-17T19:00:00+08:00',
      },
    )
    const audits = await mockRepositories.system.listAuditLogs({
      page: 1,
      pageSize: 20,
      keyword: 'req-test-revoke',
    })
    expect(audits.items).toHaveLength(1)
    expect(audits.items[0]).toMatchObject({
      action: 'session.revoke',
      objectId: 'SES-0821',
      result: 'succeeded',
    })
  })
})
