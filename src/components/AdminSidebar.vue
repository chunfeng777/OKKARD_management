<script setup lang="ts">
import type { Permission } from '@/domain/common'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface NavigationItem {
  name: string
  label: string
  icon: string
  permission: Permission
}

const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const items = computed<NavigationItem[]>(() => [
  { name: 'dashboard', label: t('nav.dashboard'), icon: '▦', permission: 'dashboard.view' },
  { name: 'products', label: t('nav.blindBoxes'), icon: '◫', permission: 'blindBox.view' },
  { name: 'card-styles', label: t('nav.cards'), icon: '▤', permission: 'inventory.view' },
  { name: 'users', label: t('nav.users'), icon: '♙', permission: 'user.view' },
  { name: 'coin-ledger', label: t('nav.finance'), icon: '◉', permission: 'finance.view' },
  { name: 'draw-orders', label: t('nav.drawOrders'), icon: '◎', permission: 'drawOrder.view' },
  { name: 'recycles', label: t('nav.fulfillment'), icon: '▰', permission: 'fulfillment.view' },
  { name: 'banners', label: t('nav.content'), icon: '▧', permission: 'content.view' },
  { name: 'tickets', label: t('nav.support'), icon: '◇', permission: 'support.view' },
  {
    name: 'notification-templates',
    label: t('nav.notifications'),
    icon: '◍',
    permission: 'notification.view',
  },
  { name: 'administrators', label: t('nav.system'), icon: '⚙', permission: 'system.view' },
])
const visibleItems = computed(() => {
  const permissions = auth.currentAdmin?.permissions ?? []
  return items.value.filter((item) => permissions.includes(item.permission))
})
</script>

<template>
  <aside :class="['admin-sidebar', { collapsed: ui.sidebarCollapsed }]">
    <RouterLink :to="{ name: 'dashboard' }" class="admin-brand">
      <span class="brand-symbol" aria-hidden="true">◇</span>
      <span
        ><b>{{ $t('brand.name') }}</b
        ><small>{{ $t('brand.admin') }}</small></span
      >
    </RouterLink>
    <nav>
      <RouterLink
        v-for="item in visibleItems"
        :key="item.name"
        :to="{ name: item.name }"
        :title="item.label"
      >
        <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span
        ><span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <button class="sidebar-toggle" @click="ui.toggleSidebar">
      <span aria-hidden="true">{{ ui.sidebarCollapsed ? '›' : '‹' }}</span>
      <span>{{ $t(ui.sidebarCollapsed ? 'nav.expand' : 'nav.collapse') }}</span>
    </button>
  </aside>
</template>
