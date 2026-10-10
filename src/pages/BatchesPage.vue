<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import type { BlindBoxBatch } from '@/domain/blind-box'
import type { BatchStatus } from '@/domain/states'
import { repositories } from '@/services'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t, d, n } = useI18n()
const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.keyword ?? ''))
const status = ref(String(route.query.status ?? ''))
const page = ref(Number(route.query.page) || 1)
const total = ref(0)
const rows = ref<BlindBoxBatch[]>([])
const loading = ref(true)
const error = ref(false)
const statuses: BatchStatus[] = [
  'draft',
  'pending_review',
  'scheduled',
  'on_sale',
  'paused',
  'sold_out',
  'archived',
]
const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: t('phase2.id') },
  { key: 'productName', label: t('phase2.product') },
  { key: 'status', label: t('phase2.status') },
  { key: 'stock', label: t('phase2.remainingStock') },
  { key: 'unitPriceCoin', label: t('phase2.unitPrice') },
  { key: 'creatorId', label: t('phase2.creator') },
  { key: 'updatedAt', label: t('phase2.updatedAt') },
  { key: 'actions', label: t('phase2.actions') },
])
const tableRows = computed(() =>
  rows.value.map((item) => ({
    ...item,
    stock: `${n(item.remainingStock, 'integer')} / ${n(item.initialStock, 'integer')}`,
    actions: item.id,
  })),
)
async function load() {
  loading.value = true
  error.value = false
  await router.replace({
    query: {
      ...(keyword.value && { keyword: keyword.value }),
      ...(status.value && { status: status.value }),
      ...(page.value > 1 && { page: String(page.value) }),
    },
  })
  try {
    const result = await repositories.blindBoxes.listBatches({
      page: page.value,
      pageSize: 20,
      keyword: keyword.value,
      status: status.value as BatchStatus | '',
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
  status.value = ''
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
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t('phase2.batchesTitle') }}</h1>
        <p>{{ $t('phase2.batchesSubtitle') }}</p>
      </div>
      <RouterLink class="button button-primary" :to="{ name: 'batch-create' }">{{
        $t('phase2.batchCreate')
      }}</RouterLink>
    </header>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset"
        ><input
          v-model="keyword"
          class="input"
          :placeholder="$t('phase2.searchBatches')"
          @keyup.enter="load"
        /><select v-model="status" class="input">
          <option value="">{{ $t('phase2.status') }}</option>
          <option v-for="item in statuses" :key="item" :value="item">
            {{ $t(`status.${item}`) }}
          </option></select
        ><template #actions
          ><button class="button button-primary" @click="load">
            {{ $t('common.search') }}
          </button></template
        ></AppFilterBar
      ><AppSkeleton v-if="loading" /><AppErrorState v-else-if="error" @retry="load" /><AppEmptyState
        v-else-if="!rows.length"
      /><template v-else
        ><AppDataTable :columns="columns" :rows="tableRows" row-key="id"
          ><template #cell-id="{ value }"
            ><code>{{ value }}</code></template
          ><template #cell-status="{ value }"><AppStatusTag :status="String(value)" /></template
          ><template #cell-unitPriceCoin="{ value }"
            >{{ n(Number(value), 'integer') }} Coin</template
          ><template #cell-updatedAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template
          ><template #cell-actions="{ row }"
            ><RouterLink
              class="text-button"
              :to="{ name: 'batch-detail', params: { batchId: String(row.id) } }"
              >{{ $t('common.details') }}</RouterLink
            ></template
          ></AppDataTable
        ><AppPagination :page="page" :page-size="20" :total="total" @change="changePage"
      /></template>
    </section>
  </div>
</template>
