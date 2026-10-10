<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import { repositories } from '@/services'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

type Row = Record<string, unknown>
const { t, d, n } = useI18n()
const route = useRoute()
const keyword = ref('')
const page = ref(1)
const total = ref(0)
const rows = ref<Row[]>([])
const loading = ref(true)
const error = ref(false)
const mode = computed(() => String(route.name))
const titleKey = computed(
  () =>
    ({
      'ip-tags': 'ipTagsTitle',
      'card-styles': 'cardStylesTitle',
      inventory: 'inventoryTitle',
      'template-pools': 'templatePoolsTitle',
      movements: 'movementsTitle',
      stocktakes: 'stocktakesTitle',
    })[mode.value] ?? 'inventoryTitle',
)
const columns = computed<TableColumn[]>(() => {
  if (mode.value === 'ip-tags')
    return [
      { key: 'id', label: t('phase2.id') },
      { key: 'name', label: t('phase2.name') },
      { key: 'productCount', label: t('phase2.product') },
      { key: 'status', label: t('phase2.status') },
    ]
  if (mode.value === 'card-styles')
    return [
      { key: 'id', label: t('phase2.id') },
      { key: 'name', label: t('phase2.style') },
      { key: 'setName', label: t('phase2.set') },
      { key: 'rarity', label: t('phase2.rarity') },
      { key: 'counts', label: t('phase2.availableCount') },
      { key: 'actions', label: t('phase2.actions') },
    ]
  if (mode.value === 'inventory')
    return [
      { key: 'id', label: t('phase2.id') },
      { key: 'styleName', label: t('phase2.style') },
      { key: 'grade', label: t('phase2.grade') },
      { key: 'certificateMasked', label: t('phase2.certificate') },
      { key: 'location', label: t('phase2.location') },
      { key: 'status', label: t('phase2.status') },
      { key: 'actions', label: t('phase2.actions') },
    ]
  if (mode.value === 'template-pools')
    return [
      { key: 'id', label: t('phase2.id') },
      { key: 'name', label: t('phase2.name') },
      { key: 'coinTier', label: t('phase2.coinTier') },
      { key: 'valueGrade', label: t('phase2.valueGrade') },
      { key: 'outstandingRights', label: t('phase2.rights') },
      { key: 'availableCandidates', label: t('phase2.candidates') },
      { key: 'gap', label: t('phase2.gap') },
      { key: 'status', label: t('phase2.status') },
    ]
  if (mode.value === 'movements')
    return [
      { key: 'id', label: t('phase2.id') },
      { key: 'physicalCardId', label: t('phase2.style') },
      { key: 'action', label: t('phase2.movement') },
      { key: 'fromLocation', label: t('phase2.from') },
      { key: 'toLocation', label: t('phase2.to') },
      { key: 'referenceId', label: t('phase2.reference') },
      { key: 'createdAt', label: t('phase2.updatedAt') },
    ]
  return [
    { key: 'id', label: t('phase2.id') },
    { key: 'warehouse', label: t('phase2.warehouse') },
    { key: 'scope', label: t('phase2.scope') },
    { key: 'expected', label: t('phase2.expected') },
    { key: 'scanned', label: t('phase2.scanned') },
    { key: 'variance', label: t('phase2.variance') },
    { key: 'status', label: t('phase2.status') },
  ]
})
async function load() {
  loading.value = true
  error.value = false
  try {
    const query = { page: page.value, pageSize: 20, keyword: keyword.value }
    let result
    if (mode.value === 'ip-tags') result = await repositories.blindBoxes.listIpTags(query)
    else if (mode.value === 'card-styles')
      result = await repositories.inventory.listCardStyles(query)
    else if (mode.value === 'inventory')
      result = await repositories.inventory.listPhysicalCards({
        ...query,
        warning: route.query.warning === 'true',
      })
    else if (mode.value === 'template-pools')
      result = await repositories.inventory.listTemplatePools({
        ...query,
        gap: route.query.gap === 'true',
      })
    else if (mode.value === 'movements') result = await repositories.inventory.listMovements(query)
    else result = await repositories.inventory.listStocktakes(query)
    rows.value = result.items.map((item) => {
      const row = item as unknown as Row
      if (mode.value === 'ip-tags') row.status = row.enabled ? 'active' : 'suspended'
      if (mode.value === 'card-styles') {
        row.counts = `${n(Number(row.availableCount), 'integer')} / ${n(Number(row.physicalCount), 'integer')}`
        row.actions = row.id
      }
      if (mode.value === 'inventory') row.actions = row.id
      return row
    })
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
watch(
  () => route.name,
  () => {
    keyword.value = ''
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
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t(`phase2.${titleKey}`) }}</h1>
        <p>
          {{ mode === 'inventory' ? $t('phase2.uploadReserved') : $t('phase2.inventorySubtitle') }}
        </p>
      </div>
      <div v-if="mode === 'inventory'" class="page-actions">
        <button class="button button-secondary" disabled :title="$t('phase2.backendRequired')">
          {{ $t('phase2.singleEntry') }}
        </button>
        <button class="button button-secondary" disabled :title="$t('phase2.backendRequired')">
          {{ $t('phase2.batchImport') }}
        </button>
        <button class="button button-secondary" disabled :title="$t('phase2.backendRequired')">
          {{ $t('phase2.scanIntake') }}
        </button>
      </div>
    </header>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset"
        ><input
          v-model="keyword"
          class="input"
          :placeholder="$t('phase2.searchInventory')"
          @keyup.enter="load"
        /><template #actions
          ><button class="button button-primary" @click="load">
            {{ $t('common.search') }}
          </button></template
        ></AppFilterBar
      ><AppSkeleton v-if="loading" /><AppErrorState v-else-if="error" @retry="load" /><AppEmptyState
        v-else-if="!rows.length"
      /><template v-else
        ><AppDataTable :columns="columns" :rows="rows" row-key="id"
          ><template #cell-id="{ value }"
            ><code>{{ value }}</code></template
          ><template #cell-status="{ value }"><AppStatusTag :status="String(value)" /></template
          ><template #cell-coinTier="{ value }">{{ n(Number(value), 'integer') }} Coin</template
          ><template #cell-createdAt="{ value }">{{ d(new Date(String(value)), 'short') }}</template
          ><template #cell-actions="{ row }"
            ><RouterLink
              v-if="mode === 'card-styles'"
              class="text-button"
              :to="{ name: 'card-style-detail', params: { styleId: String(row.id) } }"
              >{{ $t('common.details') }}</RouterLink
            ><RouterLink
              v-else
              class="text-button"
              :to="{ name: 'inventory-detail', params: { physicalCardId: String(row.id) } }"
              >{{ $t('common.details') }}</RouterLink
            ></template
          ></AppDataTable
        ><AppPagination :page="page" :page-size="20" :total="total" @change="changePage"
      /></template>
    </section>
  </div>
</template>
