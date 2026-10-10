import type { OperationContext } from '@/domain/common'

export const createOperationContext = (): OperationContext => ({
  requestId: `req_${crypto.randomUUID()}`,
  idempotencyKey: `idem_${crypto.randomUUID()}`,
  requestedAt: new Date().toISOString(),
})
