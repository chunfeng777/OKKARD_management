import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { resolveAccess } from './access'
import type { BusinessModuleKey } from '@/domain/operations'

const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const ProductsPage = () => import('@/pages/ProductsPage.vue')
const ProductDetailPage = () => import('@/pages/ProductDetailPage.vue')
const BatchesPage = () => import('@/pages/BatchesPage.vue')
const BatchCreatePage = () => import('@/pages/BatchCreatePage.vue')
const BatchDetailPage = () => import('@/pages/BatchDetailPage.vue')
const PoolEditorPage = () => import('@/pages/PoolEditorPage.vue')
const CardStylesPage = () => import('@/pages/CardStylesPage.vue')
const PhaseTwoCollectionPage = () => import('@/pages/PhaseTwoCollectionPage.vue')
const InventoryDetailPage = () => import('@/pages/InventoryDetailPage.vue')
const BusinessListPage = () => import('@/pages/BusinessListPage.vue')
const BusinessDetailPage = () => import('@/pages/BusinessDetailPage.vue')
const GlobalSearchPage = () => import('@/pages/GlobalSearchPage.vue')

const businessList = (
  path: string,
  name: string,
  moduleKey: BusinessModuleKey,
  permission: NonNullable<RouteRecordRaw['meta']>['permission'],
): RouteRecordRaw => ({
  path,
  name,
  component: BusinessListPage,
  props: { moduleKey },
  meta: { permission, titleKey: `modules.${moduleKey}` },
})

const businessDetail = (
  path: string,
  name: string,
  moduleKey: BusinessModuleKey,
  titleKey: string,
  permission: NonNullable<RouteRecordRaw['meta']>['permission'],
): RouteRecordRaw => ({
  path,
  name,
  component: BusinessDetailPage,
  props: { moduleKey },
  meta: { permission, titleKey },
})

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/pages/LoginPage.vue'),
        meta: { public: true, titleKey: 'auth.title' },
      },
    ],
  },
  {
    path: '/2fa',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'two-factor',
        component: () => import('@/pages/TwoFactorPage.vue'),
        meta: { public: true, requiresTwoFactor: true, titleKey: 'auth.twoFactorTitle' },
      },
    ],
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { permission: 'dashboard.view', titleKey: 'dashboard.title' },
      },
      {
        path: 'search',
        name: 'global-search',
        component: GlobalSearchPage,
        meta: { permission: 'dashboard.view', titleKey: 'modules.globalSearch' },
      },

      {
        path: 'blind-boxes/products',
        name: 'products',
        component: ProductsPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.productsTitle' },
      },
      {
        path: 'blind-boxes/products/new',
        name: 'product-create',
        component: ProductDetailPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.productCreate' },
      },
      {
        path: 'blind-boxes/products/:productId',
        name: 'product-detail',
        component: ProductDetailPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.productEdit' },
      },
      {
        path: 'blind-boxes/batches',
        name: 'batches',
        component: BatchesPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.batchesTitle' },
      },
      {
        path: 'blind-boxes/batches/new',
        name: 'batch-create',
        component: BatchCreatePage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.batchCreate' },
      },
      {
        path: 'blind-boxes/batches/:batchId',
        name: 'batch-detail',
        component: BatchDetailPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.batchDetail' },
      },
      {
        path: 'blind-boxes/batches/:batchId/pool',
        name: 'pool-editor',
        component: PoolEditorPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.poolTitle' },
      },
      {
        path: 'blind-boxes/batches/:batchId/review',
        name: 'batch-review',
        component: BatchDetailPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.reviewTitle' },
      },
      {
        path: 'blind-boxes/ip-tags',
        name: 'ip-tags',
        component: PhaseTwoCollectionPage,
        meta: { permission: 'blindBox.view', titleKey: 'phase2.ipTagsTitle' },
      },

      {
        path: 'cards/styles',
        name: 'card-styles',
        component: CardStylesPage,
        meta: { permission: 'inventory.view', titleKey: 'phase2.cardStylesTitle' },
      },
      {
        path: 'cards/styles/:styleId',
        name: 'card-style-detail',
        component: InventoryDetailPage,
        meta: { permission: 'inventory.view', titleKey: 'modules.cardStyleDetail' },
      },
      {
        path: 'cards/inventory',
        name: 'inventory',
        component: PhaseTwoCollectionPage,
        meta: { permission: 'inventory.view', titleKey: 'phase2.inventoryTitle' },
      },
      {
        path: 'cards/inventory/:physicalCardId',
        name: 'inventory-detail',
        component: InventoryDetailPage,
        meta: { permission: 'inventory.view', titleKey: 'modules.inventoryDetail' },
      },
      {
        path: 'cards/template-pools',
        name: 'template-pools',
        component: PhaseTwoCollectionPage,
        meta: { permission: 'inventory.view', titleKey: 'phase2.templatePoolsTitle' },
      },
      {
        path: 'cards/movements',
        name: 'movements',
        component: PhaseTwoCollectionPage,
        meta: { permission: 'inventory.view', titleKey: 'phase2.movementsTitle' },
      },
      {
        path: 'cards/stocktakes',
        name: 'stocktakes',
        component: PhaseTwoCollectionPage,
        meta: { permission: 'inventory.view', titleKey: 'phase2.stocktakesTitle' },
      },

      businessList('users', 'users', 'users', 'user.view'),
      businessList('users/risk-events', 'risk-events', 'riskEvents', 'user.view'),
      businessDetail('users/:uid', 'user-detail', 'users', 'modules.userDetail', 'user.view'),
      businessList('finance/coin-ledger', 'coin-ledger', 'coinLedger', 'finance.view'),
      businessList('finance/recharges', 'recharges', 'recharges', 'finance.view'),
      businessDetail(
        'finance/recharges/:orderId',
        'recharge-detail',
        'recharges',
        'modules.rechargeDetail',
        'finance.view',
      ),
      businessList('finance/recharge-tiers', 'recharge-tiers', 'rechargeTiers', 'finance.view'),
      businessList('finance/refunds', 'refunds', 'refunds', 'finance.view'),
      businessList('finance/chargebacks', 'chargebacks', 'chargebacks', 'finance.view'),
      businessList('finance/adjustments', 'adjustments', 'adjustments', 'finance.view'),
      businessList('draw-orders', 'draw-orders', 'drawOrders', 'drawOrder.view'),
      businessList('draw-orders/anomalies', 'draw-order-anomalies', 'anomalies', 'drawOrder.view'),
      businessDetail(
        'draw-orders/:orderId',
        'draw-order-detail',
        'drawOrders',
        'modules.drawOrderDetail',
        'drawOrder.view',
      ),

      businessList('fulfillment/recycles', 'recycles', 'recycles', 'fulfillment.view'),
      businessDetail(
        'fulfillment/recycles/:orderId',
        'recycle-detail',
        'recycles',
        'modules.recycleDetail',
        'fulfillment.view',
      ),
      businessList('fulfillment/shipments', 'shipments', 'shipments', 'fulfillment.view'),
      businessDetail(
        'fulfillment/shipments/:shipmentId',
        'shipment-detail',
        'shipments',
        'modules.shipmentDetail',
        'fulfillment.view',
      ),
      businessList('fulfillment/pick-lists', 'pick-lists', 'pickLists', 'fulfillment.view'),
      businessList('fulfillment/returns', 'returns', 'returns', 'fulfillment.view'),
      businessList(
        'fulfillment/exceptions',
        'fulfillment-exceptions',
        'exceptions',
        'fulfillment.view',
      ),

      businessList('content/banners', 'banners', 'banners', 'content.view'),
      businessList('content/home-sections', 'home-sections', 'homeSections', 'content.view'),
      businessList('content/faq', 'faq', 'faq', 'content.view'),
      businessList('content/static-pages', 'static-pages', 'staticPages', 'content.view'),
      businessList('content/localization', 'localization', 'localization', 'content.view'),
      businessDetail(
        'content/releases/:releaseId',
        'content-release',
        'contentRelease',
        'modules.contentRelease',
        'content.view',
      ),
      businessList('support/tickets', 'tickets', 'tickets', 'support.view'),
      businessDetail(
        'support/tickets/:ticketId',
        'ticket-detail',
        'tickets',
        'modules.ticketDetail',
        'support.view',
      ),
      businessList(
        'notifications/templates',
        'notification-templates',
        'notificationTemplates',
        'notification.view',
      ),
      businessList(
        'notifications/delivery-records',
        'delivery-records',
        'deliveryRecords',
        'notification.view',
      ),

      {
        path: 'system/administrators',
        name: 'administrators',
        component: () => import('@/pages/AdministratorsPage.vue'),
        meta: { permission: 'system.admin.manage', titleKey: 'admin.title' },
      },
      {
        path: 'system/sessions',
        name: 'sessions',
        component: () => import('@/pages/SessionsPage.vue'),
        meta: { permission: 'system.session.manage', titleKey: 'session.title' },
      },
      {
        path: 'system/audit-logs',
        name: 'audit-logs',
        component: () => import('@/pages/AuditLogsPage.vue'),
        meta: { permission: 'audit.view', titleKey: 'audit.title' },
      },
      businessList('system/login-records', 'login-records', 'loginRecords', 'system.view'),
      businessList('system/settings', 'system-settings', 'systemSettings', 'system.view'),
      {
        path: 'operations/:moduleKey/:recordId',
        name: 'business-record-detail',
        component: BusinessDetailPage,
        meta: { permission: 'dashboard.view', titleKey: 'operations.detailTitle' },
      },
    ],
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
    meta: { public: true, titleKey: 'state.forbiddenTitle' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { public: true, titleKey: 'state.notFoundTitle' },
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  const decision = resolveAccess(auth.authState, {
    public: to.meta.public,
    requiresTwoFactor: to.meta.requiresTwoFactor,
    permission: to.meta.permission,
    name: typeof to.name === 'string' ? to.name : undefined,
    fullPath: to.fullPath,
  })
  if (decision.allow) return true
  return { name: decision.redirect, query: decision.query }
})

router.afterEach((to) => {
  const title = i18n.global.t(String(to.meta.titleKey ?? 'brand.admin'))
  document.title = `${title} · OK Card Empire Admin`
  let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = 'robots'
    document.head.appendChild(tag)
  }
  tag.content = 'noindex,nofollow,noarchive'
})

export default router
