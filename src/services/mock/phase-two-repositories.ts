import type {
  BatchEvent,
  BlindBoxBatch,
  BlindBoxProduct,
  IpTag,
  PoolItem,
} from '@/domain/blind-box'
import {
  canTransitionBatch,
  isBatchCoreLocked,
  validateBatch as runValidation,
} from '@/domain/batch-rules'
import type {
  CardStyle,
  InventoryMovement,
  PhysicalCard,
  Stocktake,
  TemplatePool,
} from '@/domain/inventory'
import type { OperationContext, PageQuery } from '@/domain/common'
import type { BlindBoxRepository, InventoryRepository } from '../contracts'
import { RepositoryError } from '../contracts'

const delay = async () => new Promise((resolve) => window.setTimeout(resolve, 120))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const paginate = <T>(items: T[], query: PageQuery) => {
  const offset = (query.page - 1) * query.pageSize
  return {
    items: clone(items.slice(offset, offset + query.pageSize)),
    page: query.page,
    pageSize: query.pageSize,
    total: items.length,
  }
}

const cardStyles: CardStyle[] = [
  {
    id: 'STY-PKM-001',
    name: '喷火龙 ex SAR',
    category: '宝可梦',
    ipTag: 'Pokémon',
    setName: 'SV4a',
    rarity: 'SAR',
    valueGrade: 'SS',
    marketValueUsd: 2500,
    coinValue: 12000,
    referenceImageUrl: '',
    physicalCount: 4,
    availableCount: 2,
    updatedAt: '2026-09-17T15:20:00+08:00',
  },
  {
    id: 'STY-PKM-002',
    name: '皮卡丘大师球镜面',
    category: '宝可梦',
    ipTag: 'Pokémon',
    setName: '151',
    rarity: 'Master Ball',
    valueGrade: 'S',
    marketValueUsd: 850,
    coinValue: 8000,
    referenceImageUrl: '',
    physicalCount: 6,
    availableCount: 4,
    updatedAt: '2026-09-17T13:42:00+08:00',
  },
  {
    id: 'STY-PKM-003',
    name: '月亮伊布 VMAX HR',
    category: '宝可梦',
    ipTag: 'Pokémon',
    setName: 'Eevee Heroes',
    rarity: 'HR',
    valueGrade: 'SS',
    marketValueUsd: 1100,
    coinValue: 10000,
    referenceImageUrl: '',
    physicalCount: 2,
    availableCount: 1,
    updatedAt: '2026-09-16T18:05:00+08:00',
  },
]

const physicalCards: PhysicalCard[] = [
  {
    id: 'PHY-000101',
    styleId: 'STY-PKM-001',
    styleName: '喷火龙 ex SAR',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'PSA',
    grade: '10',
    certificateMasked: '82****41',
    condition: 'Gem Mint',
    location: 'A-01-02',
    status: 'batch_reserved',
    reservedBatchId: 'BAT-260920-001',
    updatedAt: '2026-09-17T15:26:00+08:00',
  },
  {
    id: 'PHY-000102',
    styleId: 'STY-PKM-002',
    styleName: '皮卡丘大师球镜面',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'PSA',
    grade: '10',
    certificateMasked: '84****28',
    condition: 'Gem Mint',
    location: 'A-01-03',
    status: 'batch_reserved',
    reservedBatchId: 'BAT-260920-001',
    updatedAt: '2026-09-17T15:27:00+08:00',
  },
  {
    id: 'PHY-000103',
    styleId: 'STY-PKM-003',
    styleName: '月亮伊布 VMAX HR',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'BGS',
    grade: '9.5',
    certificateMasked: '01****73',
    condition: 'Gem Mint',
    location: 'B-03-08',
    status: 'available',
    updatedAt: '2026-09-17T12:11:00+08:00',
  },
  {
    id: 'PHY-000104',
    styleId: 'STY-PKM-001',
    styleName: '喷火龙 ex SAR',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'CGC',
    grade: '10',
    certificateMasked: '14****92',
    condition: 'Pristine',
    location: 'A-01-04',
    status: 'pending_inspection',
    updatedAt: '2026-09-17T10:38:00+08:00',
  },
  {
    id: 'PHY-000105',
    styleId: 'STY-PKM-002',
    styleName: '皮卡丘大师球镜面',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'PSA',
    grade: '9',
    certificateMasked: '77****10',
    condition: 'Mint',
    location: 'R-02-01',
    status: 'return_inspection',
    updatedAt: '2026-09-16T18:12:00+08:00',
  },
  {
    id: 'PHY-000106',
    styleId: 'STY-PKM-001',
    styleName: '喷火龙 ex SAR',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'PSA',
    grade: '10',
    certificateMasked: '91****16',
    condition: 'Gem Mint',
    location: 'A-01-05',
    status: 'available',
    updatedAt: '2026-09-17T09:30:00+08:00',
  },
  {
    id: 'PHY-000107',
    styleId: 'STY-PKM-002',
    styleName: '皮卡丘大师球镜面',
    frontImageUrl: '',
    backImageUrl: '',
    gradingAgency: 'PSA',
    grade: '10',
    certificateMasked: '92****27',
    condition: 'Gem Mint',
    location: 'A-02-01',
    status: 'available',
    updatedAt: '2026-09-17T09:35:00+08:00',
  },
]

const templatePools: TemplatePool[] = [
  {
    id: 'TPL-2000-A',
    name: '2,000 Coin · Grade A',
    coinTier: 2000,
    valueGrade: 'A',
    outstandingRights: 34,
    availableCandidates: 46,
    lockedCandidates: 8,
    gap: 0,
    status: 'healthy',
    updatedAt: '2026-09-17T17:10:00+08:00',
  },
  {
    id: 'TPL-5000-S',
    name: '5,000 Coin · Grade S',
    coinTier: 5000,
    valueGrade: 'S',
    outstandingRights: 12,
    availableCandidates: 9,
    lockedCandidates: 4,
    gap: 3,
    status: 'blocked',
    updatedAt: '2026-09-17T17:12:00+08:00',
  },
  {
    id: 'TPL-1000-B',
    name: '1,000 Coin · Grade B',
    coinTier: 1000,
    valueGrade: 'B',
    outstandingRights: 55,
    availableCandidates: 61,
    lockedCandidates: 11,
    gap: 0,
    status: 'warning',
    updatedAt: '2026-09-17T16:55:00+08:00',
  },
]

const poolA: PoolItem[] = [
  {
    id: 'POOL-A1',
    styleId: 'STY-PKM-001',
    tier: 'SS',
    kind: 'explicit_card',
    label: '喷火龙明确卡',
    quota: 1,
    remaining: 1,
    lockedCoin: 12000,
    physicalCardIds: ['PHY-000101'],
  },
  {
    id: 'POOL-A2',
    styleId: 'STY-PKM-002',
    tier: 'S',
    kind: 'explicit_card',
    label: '皮卡丘明确卡',
    quota: 1,
    remaining: 1,
    lockedCoin: 8000,
    physicalCardIds: ['PHY-000102'],
  },
  {
    id: 'POOL-A3',
    tier: 'B',
    kind: 'template',
    label: '2,000 Coin 保底模板',
    quota: 18,
    remaining: 18,
    lockedCoin: 2000,
    physicalCardIds: [],
    templatePoolId: 'TPL-2000-A',
  },
]

const products: BlindBoxProduct[] = [
  {
    id: 'BOX-001',
    slug: 'pokemon-premium-stars',
    name: '宝可梦群星收藏',
    type: '高端收藏',
    description: '面向成年收藏用户的限量卡池。',
    tags: ['IP-PKM', '热门'],
    coverUrl: '',
    galleryUrls: [],
    seoTitle: '宝可梦群星收藏盲盒',
    saleStartAt: '2026-09-20T10:00:00+08:00',
    enabled: true,
    updatedAt: '2026-09-17T15:00:00+08:00',
  },
  {
    id: 'BOX-002',
    slug: 'pokemon-151-master',
    name: '151 大师球精选',
    type: '主题精选',
    description: '以 151 系列为主题的固定有限卡池。',
    tags: ['IP-PKM', '新品'],
    coverUrl: '',
    galleryUrls: [],
    seoTitle: '151 大师球精选盲盒',
    enabled: false,
    updatedAt: '2026-09-16T14:20:00+08:00',
  },
]

const createBatch = (overrides: Partial<BlindBoxBatch>): BlindBoxBatch => ({
  id: 'BAT-260920-001',
  productId: 'BOX-001',
  productName: '宝可梦群星收藏',
  status: 'draft',
  creatorId: 'ADM-0001',
  unitPriceCoin: 500,
  initialStock: 20,
  remainingStock: 20,
  scheduledAt: '2026-09-20T10:00:00+08:00',
  createdAt: '2026-09-17T14:00:00+08:00',
  updatedAt: '2026-09-17T15:00:00+08:00',
  requestId: 'req_batch_001',
  idempotencyKey: 'idem_batch_001',
  pool: clone(poolA),
  validation: [],
  ...overrides,
})

const batches: BlindBoxBatch[] = [
  createBatch({}),
  createBatch({
    id: 'BAT-260919-002',
    status: 'pending_review',
    creatorId: 'ADM-0002',
    updatedAt: '2026-09-17T16:30:00+08:00',
    requestId: 'req_batch_002',
    idempotencyKey: 'idem_batch_002',
  }),
  createBatch({
    id: 'BAT-260915-003',
    status: 'on_sale',
    creatorId: 'ADM-0002',
    reviewerId: 'ADM-0001',
    initialStock: 20,
    remainingStock: 7,
    scheduledAt: '2026-09-15T10:00:00+08:00',
    firstPublishedAt: '2026-09-15T10:00:00+08:00',
    updatedAt: '2026-09-17T18:00:00+08:00',
    requestId: 'req_batch_003',
    idempotencyKey: 'idem_batch_003',
    pool: poolA.map((item, index) => ({ ...item, remaining: index === 2 ? 5 : 1 })),
  }),
  createBatch({
    id: 'BAT-260912-004',
    status: 'sold_out',
    creatorId: 'ADM-0002',
    reviewerId: 'ADM-0001',
    remainingStock: 0,
    firstPublishedAt: '2026-09-12T10:00:00+08:00',
    updatedAt: '2026-09-17T12:00:00+08:00',
    requestId: 'req_batch_004',
    idempotencyKey: 'idem_batch_004',
    pool: poolA.map((item) => ({ ...item, remaining: 0 })),
  }),
]

const performValidation = (batch: BlindBoxBatch) =>
  runValidation(
    batch,
    Object.fromEntries(templatePools.map((item) => [item.id, item.availableCandidates])),
    new Set(
      physicalCards
        .filter((item) => !['damaged', 'voided', 'shipped'].includes(item.status))
        .map((item) => item.id),
    ),
  )

for (const batch of batches) batch.validation = performValidation(batch)

const batchEvents: BatchEvent[] = [
  {
    id: 'EVT-001',
    batchId: 'BAT-260915-003',
    action: 'batch.published',
    operatorId: 'ADM-0001',
    reason: '排期到点上线',
    requestId: 'req_batch_003',
    createdAt: '2026-09-15T10:00:00+08:00',
  },
  {
    id: 'EVT-002',
    batchId: 'BAT-260915-003',
    action: 'batch.review.approved',
    operatorId: 'ADM-0001',
    reason: '卡池与库存覆盖校验通过',
    requestId: 'req_review_003',
    createdAt: '2026-09-14T17:20:00+08:00',
  },
]

const ipTags: IpTag[] = [
  {
    id: 'IP-PKM',
    name: '宝可梦',
    productCount: 2,
    enabled: true,
  },
  {
    id: 'IP-PKM-151',
    name: '宝可梦 151',
    productCount: 1,
    enabled: true,
  },
]

const movements: InventoryMovement[] = [
  {
    id: 'MOV-260917-018',
    physicalCardId: 'PHY-000101',
    action: 'batch.reserve',
    fromLocation: 'A-01-02',
    toLocation: 'A-01-02',
    operator: '仓库管理员',
    referenceId: 'BAT-260920-001',
    createdAt: '2026-09-17T15:26:00+08:00',
  },
  {
    id: 'MOV-260917-017',
    physicalCardId: 'PHY-000105',
    action: 'return.received',
    fromLocation: 'OUT',
    toLocation: 'R-02-01',
    operator: '仓库管理员',
    referenceId: 'RET-260917-009',
    createdAt: '2026-09-17T14:18:00+08:00',
  },
]

const stocktakes: Stocktake[] = [
  {
    id: 'STK-260917-A',
    warehouse: '主仓',
    scope: 'A 区高价值卡',
    expected: 128,
    scanned: 128,
    variance: 0,
    status: 'completed',
    updatedAt: '2026-09-17T18:20:00+08:00',
  },
  {
    id: 'STK-260918-B',
    warehouse: '主仓',
    scope: 'B 区全量',
    expected: 342,
    scanned: 286,
    variance: -2,
    status: 'counting',
    updatedAt: '2026-09-18T09:10:00+08:00',
  },
]

const addEvent = (batchId: string, action: string, reason: string, context: OperationContext) => {
  batchEvents.unshift({
    id: `EVT-${Date.now()}`,
    batchId,
    action,
    operatorId: 'ADM-0001',
    reason,
    requestId: context.requestId,
    createdAt: context.requestedAt,
  })
}
const findBatch = (id: string) => {
  const batch = batches.find((item) => item.id === id)
  if (!batch) throw new RepositoryError('Batch not found', 'BATCH_NOT_FOUND')
  return batch
}

export const blindBoxes: BlindBoxRepository = {
  async listProducts(query) {
    await delay()
    const keyword = query.keyword?.toLowerCase() ?? ''
    const filtered = products.filter(
      (item) =>
        `${item.id} ${item.name} ${item.type}`.toLowerCase().includes(keyword) &&
        (query.enabled === undefined || item.enabled === query.enabled) &&
        (!query.type || item.type === query.type),
    )
    return paginate(filtered, query)
  },
  async getProduct(id) {
    await delay()
    const item = products.find((product) => product.id === id)
    if (!item) throw new RepositoryError('Product not found', 'PRODUCT_NOT_FOUND')
    return clone(item)
  },
  async saveProduct(product, context) {
    await delay()
    if (!product.name.trim() || !product.type.trim())
      throw new RepositoryError('盲盒名称和类型为必填项', 'PRODUCT_VALIDATION_FAILED')
    const next = {
      ...clone(product),
      id: product.id || `BOX-${String(products.length + 1).padStart(3, '0')}`,
      updatedAt: context.requestedAt,
    }
    const index = products.findIndex((item) => item.id === next.id)
    if (index >= 0) products[index] = next
    else products.unshift(next)
    return clone(next)
  },
  async listBatches(query) {
    await delay()
    const keyword = query.keyword?.toLowerCase() ?? ''
    let filtered = batches.filter(
      (item) =>
        `${item.id} ${item.productName}`.toLowerCase().includes(keyword) &&
        (!query.status || item.status === query.status),
    )
    if (query.sortBy)
      filtered = [...filtered].sort((a, b) => {
        const av = a[query.sortBy!]
        const bv = b[query.sortBy!]
        return (av > bv ? 1 : -1) * (query.sortOrder === 'asc' ? 1 : -1)
      })
    return paginate(filtered, query)
  },
  async getBatch(id) {
    await delay()
    return clone(findBatch(id))
  },
  async createDraft(productId, context) {
    await delay()
    const product = products.find((item) => item.id === productId)
    if (!product) throw new RepositoryError('Product not found', 'PRODUCT_NOT_FOUND')
    const batch = createBatch({
      id: `BAT-NEW-${String(batches.length + 1).padStart(3, '0')}`,
      productId,
      productName: product.name,
      creatorId: 'ADM-0001',
      pool: [],
      initialStock: 0,
      remainingStock: 0,
      scheduledAt: undefined,
      createdAt: context.requestedAt,
      updatedAt: context.requestedAt,
      requestId: context.requestId,
      idempotencyKey: context.idempotencyKey,
    })
    batch.validation = performValidation(batch)
    batches.unshift(batch)
    addEvent(batch.id, 'batch.created', '创建批次草稿', context)
    return clone(batch)
  },
  async saveDraft(batch, context) {
    await delay()
    const target = findBatch(batch.id)
    if (target.status !== 'draft' || isBatchCoreLocked(target))
      throw new RepositoryError('Published batch core is immutable', 'BATCH_CORE_LOCKED')
    Object.assign(target, clone(batch), {
      updatedAt: context.requestedAt,
      requestId: context.requestId,
      idempotencyKey: context.idempotencyKey,
    })
    target.validation = performValidation(target)
    addEvent(target.id, 'batch.draft.updated', '更新卡池草稿', context)
    return clone(target)
  },
  async validateBatch(id) {
    await delay()
    const target = findBatch(id)
    target.validation = performValidation(target)
    return clone(target)
  },
  async submitReview(id, reason, context) {
    await delay()
    const target = findBatch(id)
    target.validation = performValidation(target)
    if (target.status !== 'draft')
      throw new RepositoryError('Only draft can be submitted', 'BATCH_STATE_INVALID')
    if (target.validation.some((item) => !item.passed))
      throw new RepositoryError('Validation must pass', 'BATCH_VALIDATION_FAILED')
    target.status = 'pending_review'
    target.updatedAt = context.requestedAt
    addEvent(id, 'batch.review.submitted', reason, context)
    return clone(target)
  },
  async reviewBatch(id, command, context) {
    await delay()
    const target = findBatch(id)
    if (target.status !== 'pending_review')
      throw new RepositoryError('Batch is not pending review', 'BATCH_STATE_INVALID')
    if (target.creatorId === 'ADM-0001')
      throw new RepositoryError('Creator cannot review own batch', 'BATCH_SELF_REVIEW_FORBIDDEN')
    if (command.verificationCode !== '123456' || !command.reason.trim())
      throw new RepositoryError('Verification and reason required', 'OPERATION_VERIFICATION_FAILED')
    target.status = command.decision === 'approve' ? 'scheduled' : 'draft'
    target.reviewerId = 'ADM-0001'
    target.updatedAt = context.requestedAt
    addEvent(id, `batch.review.${command.decision}d`, command.reason, context)
    return clone(target)
  },
  async transitionBatch(id, status, reason, verificationCode, context) {
    await delay()
    const target = findBatch(id)
    if (!canTransitionBatch(target.status, status))
      throw new RepositoryError('Invalid batch transition', 'BATCH_TRANSITION_INVALID')
    if (!reason.trim() || verificationCode !== '123456')
      throw new RepositoryError('Verification and reason required', 'OPERATION_VERIFICATION_FAILED')
    target.status = status
    target.updatedAt = context.requestedAt
    if (status === 'on_sale' && !target.firstPublishedAt)
      target.firstPublishedAt = context.requestedAt
    addEvent(id, `batch.status.${status}`, reason, context)
    return clone(target)
  },
  async copyBatch(id, context) {
    await delay()
    const source = findBatch(id)
    const copy = clone(source)
    copy.id = `BAT-COPY-${String(batches.length + 1).padStart(3, '0')}`
    copy.status = 'draft'
    copy.creatorId = 'ADM-0001'
    delete copy.reviewerId
    delete copy.firstPublishedAt
    copy.createdAt = context.requestedAt
    copy.updatedAt = context.requestedAt
    copy.requestId = context.requestId
    copy.idempotencyKey = context.idempotencyKey
    copy.remainingStock = copy.initialStock
    copy.pool = copy.pool.map((item, index) => ({
      ...item,
      id: `${copy.id}-P${index + 1}`,
      remaining: item.quota,
    }))
    batches.unshift(copy)
    addEvent(copy.id, 'batch.copied', `复制自 ${id}`, context)
    return clone(copy)
  },
  async listBatchEvents(id) {
    await delay()
    return clone(batchEvents.filter((event) => event.batchId === id))
  },
  async listIpTags(query) {
    await delay()
    const keyword = query.keyword?.toLowerCase() ?? ''
    return paginate(
      ipTags.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(keyword)),
      query,
    )
  },
}

const filterText = <T>(items: T[], query: PageQuery, pick: (item: T) => string) => {
  const keyword = query.keyword?.toLowerCase() ?? ''
  return items.filter((item) => pick(item).toLowerCase().includes(keyword))
}

export const inventory: InventoryRepository = {
  async listCardStyles(query) {
    await delay()
    return paginate(
      filterText(cardStyles, query, (item) => `${item.id} ${item.name} ${item.setName}`),
      query,
    )
  },
  async getCardStyle(id) {
    await delay()
    const item = cardStyles.find((style) => style.id === id)
    if (!item) throw new RepositoryError('Style not found', 'STYLE_NOT_FOUND')
    return clone(item)
  },
  async saveCardStyle(style, context) {
    await delay()
    if (
      !style.name.trim() ||
      !style.category.trim() ||
      !style.rarity.trim() ||
      !style.valueGrade ||
      style.marketValueUsd < 0 ||
      style.coinValue < 0
    )
      throw new RepositoryError('卡牌款式必填信息不完整', 'STYLE_VALIDATION_FAILED')
    const index = cardStyles.findIndex((item) => item.id === style.id)
    const saved: CardStyle = {
      ...clone(style),
      id: index >= 0 ? style.id : `STY-PKM-${String(cardStyles.length + 1).padStart(3, '0')}`,
      physicalCount: index >= 0 ? cardStyles[index].physicalCount : 0,
      availableCount: index >= 0 ? cardStyles[index].availableCount : 0,
      updatedAt: context.requestedAt,
    }
    if (index >= 0) cardStyles[index] = saved
    else cardStyles.unshift(saved)
    return clone(saved)
  },
  async deleteCardStyle(id, reason, verificationCode) {
    await delay()
    const index = cardStyles.findIndex((style) => style.id === id)
    if (index < 0) throw new RepositoryError('Style not found', 'STYLE_NOT_FOUND')
    if (reason.trim().length < 5)
      throw new RepositoryError('请填写至少 5 个字的删除原因', 'REASON_REQUIRED')
    if (verificationCode !== '123456')
      throw new RepositoryError('双重验证码错误', 'INVALID_TWO_FACTOR')
    if (cardStyles[index].physicalCount > 0)
      throw new RepositoryError('该款式已关联实体卡，不允许删除', 'STYLE_HAS_INVENTORY')
    if (batches.some((batch) => batch.pool.some((item) => item.styleId === id)))
      throw new RepositoryError('该款式已被卡池引用，不允许删除', 'STYLE_IN_USE')
    cardStyles.splice(index, 1)
  },
  async listPhysicalCards(query) {
    await delay()
    let filtered = filterText(
      physicalCards,
      query,
      (item) => `${item.id} ${item.styleId} ${item.styleName} ${item.location}`,
    )
    if (query.status) filtered = filtered.filter((item) => item.status === query.status)
    if (query.warning)
      filtered = filtered.filter((item) =>
        ['pending_inspection', 'return_inspection', 'damaged'].includes(item.status),
      )
    return paginate(filtered, query)
  },
  async getPhysicalCard(id) {
    await delay()
    const item = physicalCards.find((card) => card.id === id)
    if (!item) throw new RepositoryError('Physical card not found', 'PHYSICAL_CARD_NOT_FOUND')
    return clone(item)
  },
  async listTemplatePools(query) {
    await delay()
    let filtered = filterText(templatePools, query, (item) => `${item.id} ${item.name}`)
    if (query.gap) filtered = filtered.filter((item) => item.gap > 0)
    return paginate(filtered, query)
  },
  async listMovements(query) {
    await delay()
    return paginate(
      filterText(
        movements,
        query,
        (item) => `${item.id} ${item.physicalCardId} ${item.referenceId}`,
      ),
      query,
    )
  },
  async listStocktakes(query) {
    await delay()
    return paginate(
      filterText(stocktakes, query, (item) => `${item.id} ${item.warehouse} ${item.scope}`),
      query,
    )
  },
}
