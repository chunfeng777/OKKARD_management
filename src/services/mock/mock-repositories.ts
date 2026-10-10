import type { Administrator, LoginSession } from '@/domain/admin'
import type { AuditLog } from '@/domain/audit'
import type { AdminSession, AuthChallenge } from '@/domain/auth'
import type { Permission } from '@/domain/common'
import type { DashboardSnapshot } from '@/domain/dashboard'
import type { AuthRepository, Repositories, SystemRepository } from '../contracts'
import { RepositoryError } from '../contracts'
import { operations } from './operations-repository'
import { blindBoxes, inventory } from './phase-two-repositories'

const SESSION_KEY = 'ok-card-admin-session'
const NETWORK_DELAY = 180

const permissions: Permission[] = [
  'dashboard.view',
  'blindBox.view',
  'inventory.view',
  'user.view',
  'finance.view',
  'drawOrder.view',
  'fulfillment.view',
  'content.view',
  'support.view',
  'notification.view',
  'system.view',
  'system.admin.manage',
  'system.session.manage',
  'audit.view',
]

const wait = async () => new Promise((resolve) => window.setTimeout(resolve, NETWORK_DELAY))

const createSession = (): AdminSession => ({
  token: 'mock-session-token',
  authenticationLevel: 'two_factor',
  expiresAt: '2026-09-18T10:00:00+08:00',
  admin: {
    id: 'ADM-0001',
    name: '运营管理员',
    emailMasked: 'op***@okcard.example',
    role: 'super_admin',
    permissions,
  },
})

const administrators: Administrator[] = [
  {
    id: 'ADM-0001',
    name: '运营管理员',
    emailMasked: 'op***@okcard.example',
    role: 'super_admin',
    status: 'active',
    twoFactorEnabled: true,
    lastLoginAt: '2026-09-17T18:32:00+08:00',
  },
  {
    id: 'ADM-0002',
    name: '审核管理员',
    emailMasked: 're***@okcard.example',
    role: 'super_admin',
    status: 'active',
    twoFactorEnabled: true,
    lastLoginAt: '2026-09-17T16:08:00+08:00',
  },
  {
    id: 'ADM-0003',
    name: '仓库管理员',
    emailMasked: 'wa***@okcard.example',
    role: 'super_admin',
    status: 'suspended',
    twoFactorEnabled: true,
    lastLoginAt: '2026-09-12T09:10:00+08:00',
  },
]

const sessions: LoginSession[] = [
  {
    id: 'SES-CURRENT',
    adminId: 'ADM-0001',
    device: 'Windows 11',
    browser: 'Chrome 140',
    location: 'Shanghai, CN',
    ipMasked: '116.***.24.18',
    risk: 'normal',
    current: true,
    createdAt: '2026-09-17T18:30:00+08:00',
    lastActiveAt: '2026-09-17T18:42:00+08:00',
  },
  {
    id: 'SES-0821',
    adminId: 'ADM-0001',
    device: 'macOS 15',
    browser: 'Safari 19',
    location: 'Tokyo, JP',
    ipMasked: '133.***.18.42',
    risk: 'attention',
    current: false,
    createdAt: '2026-09-16T11:25:00+08:00',
    lastActiveAt: '2026-09-17T10:11:00+08:00',
  },
  {
    id: 'SES-0748',
    adminId: 'ADM-0001',
    device: 'Android 16',
    browser: 'Chrome Mobile',
    location: 'Unknown',
    ipMasked: '45.***.91.7',
    risk: 'high',
    current: false,
    createdAt: '2026-09-14T02:06:00+08:00',
    lastActiveAt: '2026-09-14T02:06:00+08:00',
  },
]

const auditLogs: AuditLog[] = [
  {
    id: 'AUD-20260917-0008',
    adminId: 'ADM-0002',
    adminName: '审核管理员',
    action: 'sensitive.view',
    objectType: 'user_contact',
    objectId: 'UID-8829184',
    ipMasked: '116.***.8.90',
    device: 'Windows 11 · Edge',
    reason: '核对异常充值订单联系方式',
    result: 'succeeded',
    requestId: 'req_01K5C5N9A9',
    createdAt: '2026-09-17T17:48:00+08:00',
  },
  {
    id: 'AUD-20260917-0007',
    adminId: 'ADM-0001',
    adminName: '运营管理员',
    action: 'session.view',
    objectType: 'admin_session',
    objectId: 'ADM-0001',
    ipMasked: '116.***.24.18',
    device: 'Windows 11 · Chrome',
    reason: '检查异常设备',
    result: 'succeeded',
    requestId: 'req_01K5C5J31T',
    createdAt: '2026-09-17T17:39:00+08:00',
  },
  {
    id: 'AUD-20260917-0006',
    adminId: 'ADM-0003',
    adminName: '仓库管理员',
    action: 'data.export',
    objectType: 'physical_card_inventory',
    objectId: 'EXPORT-260917-04',
    ipMasked: '120.***.19.44',
    device: 'Windows 11 · Chrome',
    reason: '日终仓库盘点',
    result: 'denied',
    requestId: 'req_01K5C4Z08M',
    createdAt: '2026-09-17T16:52:00+08:00',
  },
  {
    id: 'AUD-20260917-0005',
    adminId: 'ADM-0001',
    adminName: '运营管理员',
    action: 'auth.two_factor_verified',
    objectType: 'admin_account',
    objectId: 'ADM-0001',
    ipMasked: '116.***.24.18',
    device: 'Windows 11 · Chrome',
    reason: '管理员登录',
    result: 'succeeded',
    requestId: 'req_01K5C4T2H3',
    createdAt: '2026-09-17T16:41:00+08:00',
  },
]

let activeChallenge: AuthChallenge | null = null

const auth: AuthRepository = {
  async getSession() {
    await wait()
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  },
  async signIn(command) {
    await wait()
    if (command.account !== 'admin@okcard.example' || command.password !== 'Admin123!') {
      throw new RepositoryError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }
    activeChallenge = {
      challengeId: 'mock-2fa-challenge',
      destinationMasked: '+86 138 **** 2048',
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    }
    return activeChallenge
  },
  async verifyTwoFactor(command) {
    await wait()
    if (!activeChallenge || command.challengeId !== activeChallenge.challengeId) {
      throw new RepositoryError('Challenge expired', 'AUTH_CHALLENGE_EXPIRED')
    }
    if (command.code !== '123456') {
      throw new RepositoryError('Invalid verification code', 'AUTH_INVALID_2FA_CODE')
    }
    const session = createSession()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    activeChallenge = null
    return session
  },
  async signOut() {
    await wait()
    sessionStorage.removeItem(SESSION_KEY)
  },
}

function page<T>(items: T[], pageNumber: number, pageSize: number) {
  const offset = (pageNumber - 1) * pageSize
  return {
    items: items.slice(offset, offset + pageSize),
    page: pageNumber,
    pageSize,
    total: items.length,
  }
}

const dashboard: DashboardSnapshot = {
  metrics: [
    {
      key: 'onSaleBoxes',
      value: '18',
      delta: '+2',
      tone: 'success',
      route: { name: 'batches', query: { status: 'on_sale' } },
    },
    {
      key: 'todayDraws',
      value: '4,286',
      delta: '+12.4%',
      tone: 'success',
      route: { name: 'draw-orders', query: { date: 'today' } },
    },
    {
      key: 'todayRecharge',
      value: '$184,500',
      delta: '+8.7%',
      tone: 'success',
      route: { name: 'recharges', query: { date: 'today' } },
    },
    {
      key: 'coinNet',
      value: '+2.84M',
      delta: '-3.1%',
      tone: 'warning',
      route: { name: 'coin-ledger', query: { date: 'today' } },
    },
    {
      key: 'newUsers',
      value: '326',
      delta: '+5.2%',
      tone: 'success',
      route: { name: 'users', query: { registered: 'today' } },
    },
    {
      key: 'firstRecharge',
      value: '21.8%',
      delta: '+1.6%',
      tone: 'success',
      route: { name: 'recharges', query: { firstRecharge: 'true' } },
    },
  ],
  todos: [
    {
      key: 'batchReview',
      count: 6,
      level: 'info',
      route: { name: 'batches', query: { status: 'pending_review' } },
    },
    {
      key: 'rechargeException',
      count: 3,
      level: 'danger',
      route: { name: 'recharges', query: { abnormal: 'true' } },
    },
    {
      key: 'pendingShipment',
      count: 42,
      level: 'warning',
      route: { name: 'shipments', query: { status: 'pending_review' } },
    },
    {
      key: 'stockWarning',
      count: 9,
      level: 'warning',
      route: { name: 'inventory', query: { warning: 'true' } },
    },
    {
      key: 'templateGap',
      count: 2,
      level: 'danger',
      route: { name: 'template-pools', query: { gap: 'true' } },
    },
    {
      key: 'slaRisk',
      count: 7,
      level: 'warning',
      route: { name: 'tickets', query: { sla: 'risk' } },
    },
  ],
  trend: [
    { label: '09-11', draws: 3200, recharge: 142, paidUsers: 306, coinNet: 196 },
    { label: '09-12', draws: 3480, recharge: 151, paidUsers: 322, coinNet: 208 },
    { label: '09-13', draws: 3310, recharge: 149, paidUsers: 315, coinNet: 201 },
    { label: '09-14', draws: 3820, recharge: 168, paidUsers: 351, coinNet: 227 },
    { label: '09-15', draws: 4010, recharge: 176, paidUsers: 369, coinNet: 241 },
    { label: '09-16', draws: 3890, recharge: 172, paidUsers: 361, coinNet: 232 },
    { label: '09-17', draws: 4286, recharge: 184, paidUsers: 392, coinNet: 254 },
  ],
  generatedAt: '2026-09-17T18:42:00+08:00',
}

const system: SystemRepository = {
  async getDashboard() {
    await wait()
    return structuredClone(dashboard)
  },
  async listAdministrators(query) {
    await wait()
    const keyword = query.keyword?.toLocaleLowerCase() ?? ''
    const filtered = administrators.filter((item) =>
      `${item.id} ${item.name} ${item.emailMasked}`.toLocaleLowerCase().includes(keyword),
    )
    return page(filtered, query.page, query.pageSize)
  },
  async listSessions(query) {
    await wait()
    const keyword = query.keyword?.toLocaleLowerCase() ?? ''
    const filtered = sessions.filter((item) =>
      `${item.device} ${item.browser} ${item.location}`.toLocaleLowerCase().includes(keyword),
    )
    return page(filtered, query.page, query.pageSize)
  },
  async revokeSession(sessionId, reason, verificationCode, context) {
    await wait()
    if (!reason.trim())
      throw new RepositoryError('Reason is required', 'VALIDATION_REASON_REQUIRED')
    if (verificationCode !== '123456') {
      throw new RepositoryError('Invalid verification code', 'AUTH_INVALID_2FA_CODE')
    }
    const target = sessions.find((item) => item.id === sessionId)
    if (!target || target.current) {
      throw new RepositoryError('Session cannot be revoked', 'SESSION_NOT_REVOCABLE')
    }
    sessions.splice(sessions.indexOf(target), 1)
    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      adminId: 'ADM-0001',
      adminName: '运营管理员',
      action: 'session.revoke',
      objectType: 'admin_session',
      objectId: sessionId,
      ipMasked: '116.***.24.18',
      device: 'Windows 11 · Chrome',
      reason,
      result: 'succeeded',
      requestId: context.requestId,
      createdAt: context.requestedAt,
      before: { active: true },
      after: { active: false },
    })
  },
  async listAuditLogs(query) {
    await wait()
    const keyword = query.keyword?.toLocaleLowerCase() ?? ''
    const filtered = auditLogs.filter((item) => {
      const matchesKeyword =
        `${item.id} ${item.adminName} ${item.objectId} ${item.reason} ${item.requestId}`
          .toLocaleLowerCase()
          .includes(keyword)
      return (
        matchesKeyword &&
        (!query.action || item.action === query.action) &&
        (!query.result || item.result === query.result)
      )
    })
    return page(filtered, query.page, query.pageSize)
  },
}

export const mockRepositories: Repositories = { auth, system, blindBoxes, inventory, operations }
