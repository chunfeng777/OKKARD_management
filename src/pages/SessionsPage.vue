<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import HighRiskConfirmDialog from '@/components/HighRiskConfirmDialog.vue'
import type { LoginSession } from '@/domain/admin'
import { repositories } from '@/services'
import { useUiStore } from '@/stores/ui'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, d } = useI18n()
const ui = useUiStore()
const keyword = ref('')
const page = ref(1)
const total = ref(0)
const rows = ref<LoginSession[]>([])
const loading = ref(true)
const error = ref(false)
const selected = ref<LoginSession | null>(null)
const revoking = ref(false)
const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: t('session.id') },
  { key: 'device', label: t('session.device') },
  { key: 'location', label: t('session.location') },
  { key: 'risk', label: t('session.risk') },
  { key: 'createdAt', label: t('session.createdAt') },
  { key: 'lastActiveAt', label: t('session.lastActive') },
  { key: 'action', label: t('session.action'), width: '150px' },
])
const tableRows = computed(() => rows.value.map((item) => ({ ...item, action: '' })))

async function load() {
  loading.value = true
  error.value = false
  try {
    const result = await repositories.system.listSessions({
      page: page.value,
      pageSize: 20,
      keyword: keyword.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
function reset() {
  keyword.value = ''
  page.value = 1
  void load()
}
function changePage(value: number) {
  page.value = value
  void load()
}
async function revoke(payload: { reason: string; verificationCode: string }) {
  if (!selected.value || revoking.value) return
  revoking.value = true
  try {
    await repositories.system.revokeSession(
      selected.value.id,
      payload.reason,
      payload.verificationCode,
      {
        requestId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        requestedAt: new Date().toISOString(),
      },
    )
    selected.value = null
    ui.showToast('success', t('session.revoked'), t('session.revokedMessage'))
    await load()
  } catch {
    ui.showToast('danger', t('session.revokeError'), t('state.errorDescription'))
  } finally {
    revoking.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('session.eyebrow') }}</span>
        <h1>{{ $t('session.title') }}</h1>
        <p>{{ $t('session.subtitle') }}</p>
      </div>
    </header>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset"
        ><input
          v-model="keyword"
          class="input"
          :placeholder="$t('session.search')"
          @keyup.enter="load"
        /><template #actions
          ><button class="button button-primary" @click="load">
            {{ $t('common.search') }}
          </button></template
        ></AppFilterBar
      >
      <AppSkeleton v-if="loading" />
      <AppErrorState v-else-if="error" @retry="load" />
      <AppEmptyState v-else-if="!rows.length" />
      <template v-else>
        <AppDataTable :columns="columns" :rows="tableRows" row-key="id">
          <template #cell-id="{ value }"
            ><code>{{ value }}</code></template
          >
          <template #cell-device="{ row }"
            ><b>{{ row.device }}</b
            ><small class="cell-subtext">{{ row.browser }}</small></template
          >
          <template #cell-location="{ row }"
            ><span>{{ row.location }}</span
            ><small class="cell-subtext">{{ row.ipMasked }}</small></template
          >
          <template #cell-risk="{ value }"><AppStatusTag :status="String(value)" /></template>
          <template #cell-createdAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template>
          <template #cell-lastActiveAt="{ value }">{{
            d(new Date(String(value)), 'short')
          }}</template>
          <template #cell-action="{ row }"
            ><span v-if="row.current" class="current-session">{{ $t('common.current') }}</span
            ><button
              v-else
              class="button button-danger button-small"
              @click="selected = rows.find((item) => item.id === row.id) ?? null"
            >
              {{ $t('common.revoke') }}
            </button></template
          >
        </AppDataTable>
        <AppPagination :page="page" :page-size="20" :total="total" @change="changePage" />
      </template>
    </section>
    <HighRiskConfirmDialog
      :open="Boolean(selected)"
      :title="$t('session.revokeTitle')"
      :object-label="selected?.id ?? ''"
      :impact="$t('session.revokeImpact')"
      :consequence="$t('session.revokeConsequence')"
      :busy="revoking"
      @close="selected = null"
      @confirm="revoke"
    />
  </div>
</template>
