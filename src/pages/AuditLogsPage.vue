<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import type { AuditAction, AuditLog } from '@/domain/audit'
import { repositories } from '@/services'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, d } = useI18n()
const keyword = ref('')
const action = ref('')
const resultFilter = ref('')
const page = ref(1)
const total = ref(0)
const rows = ref<AuditLog[]>([])
const loading = ref(true)
const error = ref(false)
const actionOptions: AuditAction[] = [
  'auth.login',
  'auth.two_factor_verified',
  'auth.logout',
  'session.view',
  'session.revoke',
  'sensitive.view',
  'data.export',
]
const actionTranslation: Record<AuditAction, string> = {
  'auth.login': 'login',
  'auth.two_factor_verified': 'twoFactor',
  'auth.logout': 'logout',
  'session.view': 'sessionView',
  'session.revoke': 'sessionRevoke',
  'sensitive.view': 'sensitiveView',
  'data.export': 'export',
}
const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: t('audit.id') },
  { key: 'administrator', label: t('audit.administrator') },
  { key: 'action', label: t('audit.action') },
  { key: 'object', label: t('audit.object') },
  { key: 'reason', label: t('audit.reason') },
  { key: 'requestId', label: t('audit.requestId') },
  { key: 'result', label: t('audit.result') },
  { key: 'createdAt', label: t('audit.time') },
])
const tableRows = computed(() =>
  rows.value.map((item) => ({
    ...item,
    administrator: item.adminName,
    object: `${item.objectType} · ${item.objectId}`,
  })),
)
const actionLabel = (value: AuditAction) => t(`audit.actions.${actionTranslation[value]}`)

async function load() {
  loading.value = true
  error.value = false
  try {
    const response = await repositories.system.listAuditLogs({
      page: page.value,
      pageSize: 20,
      keyword: keyword.value,
      action: action.value || undefined,
      result: resultFilter.value || undefined,
    })
    rows.value = response.items
    total.value = response.total
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
function reset() {
  keyword.value = ''
  action.value = ''
  resultFilter.value = ''
  page.value = 1
  void load()
}
function changePage(value: number) {
  page.value = value
  void load()
}
onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('audit.eyebrow') }}</span>
        <h1>{{ $t('audit.title') }}</h1>
        <p>{{ $t('audit.subtitle') }}</p>
      </div>
      <span class="immutable-note">◇ {{ $t('audit.noDelete') }}</span>
    </header>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset">
        <input
          v-model="keyword"
          class="input"
          :placeholder="$t('audit.search')"
          @keyup.enter="load"
        />
        <select v-model="action" class="input">
          <option value="">{{ $t('audit.allActions') }}</option>
          <option v-for="item in actionOptions" :key="item" :value="item">
            {{ actionLabel(item) }}
          </option>
        </select>
        <select v-model="resultFilter" class="input">
          <option value="">{{ $t('audit.allResults') }}</option>
          <option value="succeeded">{{ $t('status.succeeded') }}</option>
          <option value="failed">{{ $t('status.failed') }}</option>
          <option value="denied">{{ $t('status.denied') }}</option>
        </select>
        <template #actions
          ><button class="button button-primary" @click="load">
            {{ $t('common.search') }}
          </button></template
        >
      </AppFilterBar>
      <AppSkeleton v-if="loading" />
      <AppErrorState v-else-if="error" @retry="load" />
      <AppEmptyState v-else-if="!rows.length" />
      <template v-else>
        <AppDataTable :columns="columns" :rows="tableRows" row-key="id">
          <template #cell-id="{ value }"
            ><code>{{ value }}</code></template
          >
          <template #cell-administrator="{ row }"
            ><b>{{ row.administrator }}</b
            ><small class="cell-subtext">{{ row.adminId }}</small></template
          >
          <template #cell-action="{ value }">{{
            actionLabel(String(value) as AuditAction)
          }}</template>
          <template #cell-object="{ value }"
            ><code>{{ value }}</code></template
          >
          <template #cell-requestId="{ value }"
            ><code>{{ value }}</code></template
          >
          <template #cell-result="{ value }"><AppStatusTag :status="String(value)" /></template>
          <template #cell-createdAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template>
        </AppDataTable>
        <AppPagination :page="page" :page-size="20" :total="total" @change="changePage" />
      </template>
    </section>
  </div>
</template>
