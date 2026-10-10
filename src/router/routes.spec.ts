import { describe, expect, it } from 'vitest'
import { routes } from './index'

describe('admin route structure', () => {
  it('keeps authentication layouts out of the protected root route', () => {
    expect(routes.filter((route) => route.path === '/')).toHaveLength(1)
    expect(routes.some((route) => route.path === '/login')).toBe(true)
    expect(routes.some((route) => route.path === '/2fa')).toBe(true)
  })

  it('registers every phase-two page as an authenticated business route', () => {
    const root = routes.find((route) => route.path === '/')
    const names = new Set(root?.children?.map((route) => route.name))
    expect(
      [
        'products',
        'product-detail',
        'batches',
        'batch-create',
        'batch-detail',
        'pool-editor',
        'batch-review',
        'ip-tags',
        'card-styles',
        'inventory',
        'template-pools',
        'movements',
        'stocktakes',
      ].every((name) => names.has(name)),
    ).toBe(true)
  })

  it('replaces all remaining module placeholders with operational routes', () => {
    const root = routes.find((route) => route.path === '/')
    const names = new Set(root?.children?.map((route) => route.name))
    expect(
      [
        'users',
        'risk-events',
        'coin-ledger',
        'recharges',
        'draw-orders',
        'recycles',
        'shipments',
        'banners',
        'tickets',
        'notification-templates',
        'login-records',
        'system-settings',
        'global-search',
      ].every((name) => names.has(name)),
    ).toBe(true)
  })
})
