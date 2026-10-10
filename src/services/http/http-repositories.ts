import type {
  AuthRepository,
  BlindBoxRepository,
  InventoryRepository,
  Repositories,
  OperationsRepository,
  SystemRepository,
} from '../contracts'
import { RepositoryError } from '../contracts'

const notConfigured = (): never => {
  throw new RepositoryError(
    'The backend contract is not configured. Set the agreed API adapter before using API mode.',
    'API_CONTRACT_NOT_CONFIGURED',
  )
}

const auth: AuthRepository = {
  getSession: async () => notConfigured(),
  signIn: async () => notConfigured(),
  verifyTwoFactor: async () => notConfigured(),
  signOut: async () => notConfigured(),
}

const system: SystemRepository = {
  getDashboard: async () => notConfigured(),
  listAdministrators: async () => notConfigured(),
  listSessions: async () => notConfigured(),
  revokeSession: async () => notConfigured(),
  listAuditLogs: async () => notConfigured(),
}

const blindBoxes: BlindBoxRepository = {
  listProducts: async () => notConfigured(),
  getProduct: async () => notConfigured(),
  saveProduct: async () => notConfigured(),
  listBatches: async () => notConfigured(),
  getBatch: async () => notConfigured(),
  createDraft: async () => notConfigured(),
  saveDraft: async () => notConfigured(),
  validateBatch: async () => notConfigured(),
  submitReview: async () => notConfigured(),
  reviewBatch: async () => notConfigured(),
  transitionBatch: async () => notConfigured(),
  copyBatch: async () => notConfigured(),
  listBatchEvents: async () => notConfigured(),
  listIpTags: async () => notConfigured(),
}

const inventory: InventoryRepository = {
  listCardStyles: async () => notConfigured(),
  getCardStyle: async () => notConfigured(),
  saveCardStyle: async () => notConfigured(),
  deleteCardStyle: async () => notConfigured(),
  listPhysicalCards: async () => notConfigured(),
  getPhysicalCard: async () => notConfigured(),
  listTemplatePools: async () => notConfigured(),
  listMovements: async () => notConfigured(),
  listStocktakes: async () => notConfigured(),
}

const operations: OperationsRepository = {
  listRecords: async () => notConfigured(),
  getRecord: async () => notConfigured(),
  executeAction: async () => notConfigured(),
  saveRecord: async () => notConfigured(),
}

export const httpRepositories: Repositories = { auth, system, blindBoxes, inventory, operations }
