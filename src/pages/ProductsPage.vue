<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import BlindBoxWorkflowSteps from '@/components/BlindBoxWorkflowSteps.vue'
import type { BlindBoxBatch, BlindBoxProduct } from '@/domain/blind-box'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t, d } = useI18n()
const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.keyword ?? ''))
const enabled = ref(String(route.query.enabled ?? ''))
const type = ref(String(route.query.type ?? ''))
const page = ref(Number(route.query.page) || 1)
const total = ref(0)
const catalogTotal = ref(0)
const rows = ref<BlindBoxProduct[]>([])
const allProducts = ref<BlindBoxProduct[]>([])
const batches = ref<BlindBoxBatch[]>([])
const loading = ref(true)
const error = ref(false)
const configuringId = ref('')

const hasFilters = computed(() => Boolean(keyword.value || enabled.value || type.value))
const types = computed(() =>
  [...new Set(allProducts.value.map((item) => item.type).filter(Boolean))].sort(),
)
const draftByProduct = computed(() => {
  const result = new Map<string, BlindBoxBatch>()
  for (const batch of batches.value) {
    if (batch.status !== 'draft' || result.has(batch.productId)) continue
    result.set(batch.productId, batch)
  }
  return result
})
const columns = computed<TableColumn[]>(() => [
  { key: 'box', label: t('phase2.product'), width: '30%' },
  { key: 'type', label: t('phase2.boxType') },
  { key: 'enabled', label: t('phase2.status') },
  { key: 'pool', label: t('phase2.draftPool') },
  { key: 'updatedAt', label: t('phase2.updatedAt') },
  { key: 'actions', label: t('phase2.actions') },
])
const tableRows = computed(() =>
  rows.value.map((item) => ({
    ...item,
    box: item.name,
    pool: draftByProduct.value.get(item.id)?.id ?? '',
    actions: item.id,
  })),
)

async function load() {
  loading.value = true
  error.value = false
  await router.replace({
    query: {
      ...(keyword.value && { keyword: keyword.value }),
      ...(enabled.value && { enabled: enabled.value }),
      ...(type.value && { type: type.value }),
      ...(page.value > 1 && { page: String(page.value) }),
    },
  })
  try {
    const [result, catalog, batchResult] = await Promise.all([
      repositories.blindBoxes.listProducts({
        page: page.value,
        pageSize: 20,
        keyword: keyword.value,
        enabled: enabled.value ? enabled.value === 'true' : undefined,
        type: type.value,
      }),
      repositories.blindBoxes.listProducts({ page: 1, pageSize: 200 }),
      repositories.blindBoxes.listBatches({ page: 1, pageSize: 200 }),
    ])
    rows.value = result.items
    total.value = result.total
    allProducts.value = catalog.items
    catalogTotal.value = catalog.total
    batches.value = batchResult.items
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function setStatus(value: '' | 'true' | 'false') {
  enabled.value = value
  page.value = 1
  void load()
}

function applyFilters() {
  page.value = 1
  void load()
}

function clearFilters() {
  keyword.value = ''
  enabled.value = ''
  type.value = ''
  page.value = 1
  void load()
}

function changePage(value: number) {
  page.value = value
  void load()
}

async function configure(productId: string) {
  if (configuringId.value) return
  configuringId.value = productId
  try {
    let batch = draftByProduct.value.get(productId)
    if (!batch)
      batch = await repositories.blindBoxes.createDraft(productId, createOperationContext())
    await router.push({ name: 'pool-editor', params: { batchId: batch.id } })
  } finally {
    configuringId.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header blind-box-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t('phase2.productsTitle') }}</h1>
        <p>{{ $t('phase2.productsSubtitle') }}</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button button-secondary" :to="{ name: 'batches' }">{{
          $t('phase2.manageBatches')
        }}</RouterLink>
        <RouterLink class="button button-primary" :to="{ name: 'product-create' }"
          >+ {{ $t('phase2.productCreate') }}</RouterLink
        >
      </div>
    </header>

    <BlindBoxWorkflowSteps :active="1" />

    <section class="panel blind-box-filter-panel">
      <div class="blind-box-search-row">
        <label class="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            v-model.trim="keyword"
            :placeholder="$t('phase2.searchBoxName')"
            @keyup.enter="applyFilters"
          />
        </label>
        <select v-model="type" class="input" @change="applyFilters">
          <option value="">{{ $t('phase2.allTypes') }}</option>
          <option v-for="item in types" :key="item" :value="item">{{ item }}</option>
        </select>
        <button class="button button-primary" @click="applyFilters">
          {{ $t('common.search') }}
        </button>
      </div>
      <div class="blind-box-status-row">
        <div class="segmented-filter" :aria-label="$t('phase2.status')">
          <button :class="{ active: enabled === '' }" @click="setStatus('')">
            {{ $t('phase2.allStatuses') }}
          </button>
          <button :class="{ active: enabled === 'true' }" @click="setStatus('true')">
            {{ $t('phase2.listed') }}
          </button>
          <button :class="{ active: enabled === 'false' }" @click="setStatus('false')">
            {{ $t('phase2.unlisted') }}
          </button>
        </div>
        <div class="filter-summary">
          <span>{{ $t('phase2.resultCount', { visible: total, total: catalogTotal }) }}</span>
          <button v-if="hasFilters" class="text-button" @click="clearFilters">
            × {{ $t('phase2.clearFilters') }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel table-panel blind-box-table-panel">
      <AppSkeleton v-if="loading" />
      <AppErrorState v-else-if="error" @retry="load" />
      <div v-else-if="!rows.length" class="box-empty-state">
        <span aria-hidden="true">⌕</span>
        <h2>{{ $t('phase2.noBoxesFound') }}</h2>
        <p>{{ $t('phase2.noBoxesNext') }}</p>
        <button v-if="hasFilters" class="button button-secondary" @click="clearFilters">
          {{ $t('phase2.clearFilters') }}
        </button>
        <RouterLink v-else class="button button-primary" :to="{ name: 'product-create' }"
          >+ {{ $t('phase2.productCreate') }}</RouterLink
        >
      </div>
      <template v-else>
        <AppDataTable :columns="columns" :rows="tableRows" row-key="id">
          <template #cell-box="{ row }">
            <div class="blind-box-cell">
              <div class="blind-box-cover">
                <img v-if="row.coverUrl" :src="String(row.coverUrl)" :alt="String(row.name)" />
                <span v-else aria-hidden="true">◫</span>
              </div>
              <div>
                <b>{{ row.name }}</b
                ><small>{{ row.id }} · {{ row.slug }}</small>
              </div>
            </div>
          </template>
          <template #cell-enabled="{ value }">
            <AppStatusTag
              :status="value ? 'active' : 'suspended'"
              :label="$t(value ? 'phase2.listed' : 'phase2.unlisted')"
            />
          </template>
          <template #cell-pool="{ value }"
            ><code v-if="value">{{ value }}</code
            ><span v-else class="text-warning">{{ $t('phase2.noDraftPool') }}</span></template
          >
          <template #cell-updatedAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template>
          <template #cell-actions="{ row }">
            <div class="row-actions">
              <RouterLink
                class="text-button"
                :to="{ name: 'product-detail', params: { productId: String(row.id) } }"
                >{{ $t('phase2.editBox') }}</RouterLink
              >
              <button
                class="text-button configure-button"
                :disabled="Boolean(configuringId)"
                @click="configure(String(row.id))"
              >
                <span v-if="configuringId === row.id" class="spinner" />{{
                  $t(configuringId === row.id ? 'phase2.configuring' : 'phase2.configureCards')
                }}
              </button>
            </div>
          </template>
        </AppDataTable>
        <AppPagination :page="page" :page-size="20" :total="total" @change="changePage" />
      </template>
    </section>
  </div>
</template>
