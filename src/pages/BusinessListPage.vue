<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import { businessModuleMeta } from '@/config/business-modules'
import type { BusinessModuleKey, BusinessRecord } from '@/domain/operations'
import { repositories } from '@/services'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ moduleKey: BusinessModuleKey }>()
const { t, d } = useI18n()
const route = useRoute()
const router = useRouter()
const meta = computed(() => businessModuleMeta[props.moduleKey])
const keyword = ref(String(route.query.keyword ?? ''))
const status = ref(String(route.query.status ?? ''))
const risk = ref(String(route.query.risk ?? ''))
const page = ref(Math.max(1, Number(route.query.page ?? 1)))
const pageSize = 20
const total = ref(0)
const rows = ref<BusinessRecord[]>([])
const loading = ref(true)
const error = ref(false)
const requestId = ref('')
const copied = ref('')

const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: t('operations.number') },
  { key: 'title', label: t('operations.subject') },
  { key: 'status', label: t('operations.status') },
  { key: 'summaryA', label: meta.value.primaryLabel },
  { key: 'summaryB', label: meta.value.secondaryLabel },
  { key: 'summaryC', label: meta.value.tertiaryLabel },
  { key: 'risk', label: t('operations.risk') },
  { key: 'updatedAt', label: t('operations.updatedAt') },
  { key: 'actions', label: t('operations.actions') },
])

async function syncQuery() {
  await router.replace({
    query: {
      ...(keyword.value ? { keyword: keyword.value } : {}),
      ...(status.value ? { status: status.value } : {}),
      ...(risk.value ? { risk: risk.value } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {}),
    },
  })
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const result = await repositories.operations.listRecords(props.moduleKey, {
      page: page.value,
      pageSize,
      keyword: keyword.value,
      status: status.value || undefined,
      risk: risk.value || undefined,
    })
    rows.value = result.items
    total.value = result.total
    await syncQuery()
  } catch (reason) {
    error.value = true
    requestId.value =
      reason instanceof Error && 'requestId' in reason ? String(reason.requestId) : ''
  } finally {
    loading.value = false
  }
}

function reset() {
  keyword.value = ''
  status.value = ''
  risk.value = ''
  page.value = 1
  void load()
}

function search() {
  page.value = 1
  void load()
}

function changePage(value: number) {
  page.value = value
  void load()
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
  copied.value = value
  window.setTimeout(() => (copied.value = ''), 1200)
}

function exportPage() {
  const header = columns.value.slice(0, -1).map((item) => item.label)
  const data = rows.value.map((item) => [
    item.id,
    item.title,
    item.status,
    item.summaryA,
    item.summaryB,
    item.summaryC,
    item.risk,
    item.updatedAt,
  ])
  const csv = [header, ...data]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${props.moduleKey}-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function detailTo(row: Record<string, unknown>) {
  if (meta.value.detailRoute && meta.value.detailParam) {
    return { name: meta.value.detailRoute, params: { [meta.value.detailParam]: String(row.id) } }
  }
  return {
    name: 'business-record-detail',
    params: { moduleKey: props.moduleKey, recordId: String(row.id) },
  }
}

watch(
  () => props.moduleKey,
  () => {
    keyword.value = ''
    status.value = ''
    risk.value = ''
    page.value = 1
    void load()
  },
)
onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ meta.eyebrow }}</span>
        <h1>{{ meta.title }}</h1>
        <p>{{ meta.subtitle }}</p>
      </div>
      <div class="page-actions">
        <span v-if="meta.immutable" class="immutable-note">{{ $t('operations.immutable') }}</span>
        <button class="button button-secondary" :disabled="!rows.length" @click="exportPage">
          {{ $t('operations.exportCurrent') }}
        </button>
      </div>
    </header>

    <section class="panel table-panel">
      <AppFilterBar @reset="reset">
        <input
          v-model="keyword"
          class="input"
          :placeholder="$t('operations.searchPlaceholder')"
          @keyup.enter="load"
        />
        <select v-model="status" class="input" @change="page = 1">
          <option value="">{{ $t('operations.allStatuses') }}</option>
          <option value="active">{{ $t('status.active') }}</option>
          <option value="pending_review">{{ $t('status.pending_review') }}</option>
          <option value="processing">{{ $t('status.processing') }}</option>
          <option value="succeeded">{{ $t('status.succeeded') }}</option>
          <option value="failed">{{ $t('status.failed') }}</option>
        </select>
        <select v-model="risk" class="input" @change="page = 1">
          <option value="">{{ $t('operations.allRisks') }}</option>
          <option value="normal">{{ $t('status.normal') }}</option>
          <option value="attention">{{ $t('status.attention') }}</option>
          <option value="high">{{ $t('status.high') }}</option>
        </select>
        <template #actions>
          <button class="button button-primary" @click="search">
            {{ $t('common.search') }}
          </button>
        </template>
      </AppFilterBar>

      <AppSkeleton v-if="loading" :rows="6" />
      <AppErrorState v-else-if="error" :request-id="requestId" @retry="load" />
      <AppEmptyState v-else-if="!rows.length">
        <button class="button button-secondary" @click="reset">{{ $t('common.reset') }}</button>
      </AppEmptyState>
      <template v-else>
        <AppDataTable :columns="columns" :rows="rows" row-key="id">
          <template #cell-id="{ value }">
            <span class="copy-cell"
              ><code>{{ value }}</code
              ><button class="text-button" @click="copy(String(value))">
                {{ copied === value ? $t('common.copied') : $t('common.copy') }}
              </button></span
            >
          </template>
          <template #cell-title="{ row }"
            ><b>{{ row.title }}</b
            ><small class="cell-secondary">{{ row.secondary }}</small></template
          >
          <template #cell-status="{ value }"><AppStatusTag :status="String(value)" /></template>
          <template #cell-risk="{ value }"><AppStatusTag :status="String(value)" /></template>
          <template #cell-updatedAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template>
          <template #cell-actions="{ row }"
            ><RouterLink class="text-button" :to="detailTo(row)">{{
              $t('common.details')
            }}</RouterLink></template
          >
        </AppDataTable>
        <AppPagination :page="page" :page-size="pageSize" :total="total" @change="changePage" />
      </template>
    </section>
  </div>
</template>
