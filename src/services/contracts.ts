import type { Administrator, LoginSession } from '@/domain/admin'
import type { AuditLog } from '@/domain/audit'
import type { AdminSession, AuthChallenge, LoginCommand, TwoFactorCommand } from '@/domain/auth'
import type { OperationContext, PageQuery, PageResult } from '@/domain/common'
import type { DashboardSnapshot } from '@/domain/dashboard'
import type {
  BatchEvent,
  BatchQuery,
  BatchReviewCommand,
  BlindBoxBatch,
  BlindBoxProduct,
  IpTag,
  ProductQuery,
} from '@/domain/blind-box'
import type {
  CardStyle,
  InventoryMovement,
  PhysicalCard,
  Stocktake,
  TemplatePool,
} from '@/domain/inventory'
import type { BatchStatus } from '@/domain/states'
import type {
  BusinessActionCommand,
  BusinessModuleKey,
  BusinessQuery,
  BusinessRecord,
  BusinessSaveCommand,
} from '@/domain/operations'

export interface AuthRepository {
  getSession(): Promise<AdminSession | null>
  signIn(command: LoginCommand): Promise<AuthChallenge>
  verifyTwoFactor(command: TwoFactorCommand): Promise<AdminSession>
  signOut(): Promise<void>
}

export interface SystemRepository {
  getDashboard(): Promise<DashboardSnapshot>
  listAdministrators(query: PageQuery): Promise<PageResult<Administrator>>
  listSessions(query: PageQuery): Promise<PageResult<LoginSession>>
  revokeSession(
    sessionId: string,
    reason: string,
    verificationCode: string,
    context: OperationContext,
  ): Promise<void>
  listAuditLogs(
    query: PageQuery & { action?: string; result?: string },
  ): Promise<PageResult<AuditLog>>
}

export interface BlindBoxRepository {
  listProducts(query: ProductQuery): Promise<PageResult<BlindBoxProduct>>
  getProduct(id: string): Promise<BlindBoxProduct>
  saveProduct(product: BlindBoxProduct, context: OperationContext): Promise<BlindBoxProduct>
  listBatches(query: BatchQuery): Promise<PageResult<BlindBoxBatch>>
  getBatch(id: string): Promise<BlindBoxBatch>
  createDraft(productId: string, context: OperationContext): Promise<BlindBoxBatch>
  saveDraft(batch: BlindBoxBatch, context: OperationContext): Promise<BlindBoxBatch>
  validateBatch(id: string): Promise<BlindBoxBatch>
  submitReview(id: string, reason: string, context: OperationContext): Promise<BlindBoxBatch>
  reviewBatch(
    id: string,
    command: BatchReviewCommand,
    context: OperationContext,
  ): Promise<BlindBoxBatch>
  transitionBatch(
    id: string,
    status: BatchStatus,
    reason: string,
    verificationCode: string,
    context: OperationContext,
  ): Promise<BlindBoxBatch>
  copyBatch(id: string, context: OperationContext): Promise<BlindBoxBatch>
  listBatchEvents(id: string): Promise<BatchEvent[]>
  listIpTags(query: PageQuery): Promise<PageResult<IpTag>>
}

export interface InventoryRepository {
  listCardStyles(query: PageQuery): Promise<PageResult<CardStyle>>
  getCardStyle(id: string): Promise<CardStyle>
  saveCardStyle(style: CardStyle, context: OperationContext): Promise<CardStyle>
  deleteCardStyle(
    id: string,
    reason: string,
    verificationCode: string,
    context: OperationContext,
  ): Promise<void>
  listPhysicalCards(
    query: PageQuery & { status?: string; warning?: boolean },
  ): Promise<PageResult<PhysicalCard>>
  getPhysicalCard(id: string): Promise<PhysicalCard>
  listTemplatePools(query: PageQuery & { gap?: boolean }): Promise<PageResult<TemplatePool>>
  listMovements(query: PageQuery): Promise<PageResult<InventoryMovement>>
  listStocktakes(query: PageQuery): Promise<PageResult<Stocktake>>
}

export interface OperationsRepository {
  listRecords(module: BusinessModuleKey, query: BusinessQuery): Promise<PageResult<BusinessRecord>>
  getRecord(module: BusinessModuleKey, id: string): Promise<BusinessRecord>
  executeAction(
    module: BusinessModuleKey,
    id: string,
    command: BusinessActionCommand,
  ): Promise<BusinessRecord>
  saveRecord(
    module: BusinessModuleKey,
    id: string,
    command: BusinessSaveCommand,
  ): Promise<BusinessRecord>
}

export interface Repositories {
  auth: AuthRepository
  system: SystemRepository
  blindBoxes: BlindBoxRepository
  inventory: InventoryRepository
  operations: OperationsRepository
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly requestId = crypto.randomUUID(),
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}
