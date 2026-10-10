<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import CardStyleEditorDialog from '@/components/CardStyleEditorDialog.vue'
import HighRiskConfirmDialog from '@/components/HighRiskConfirmDialog.vue'
import type { CardStyle } from '@/domain/inventory'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t, n } = useI18n()
const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.keyword ?? ''))
const category = ref(String(route.query.category ?? ''))
const page = ref(Number(route.query.page) || 1)
const total = ref(0)
const rows = ref<CardStyle[]>([])
const loading = ref(true)
const error = ref(false)
const busy = ref(false)
const notice = ref('')
const editorOpen = ref(false)
const deleteOpen = ref(false)
const activeStyle = ref<CardStyle>(emptyStyle())

function emptyStyle(): CardStyle {
  return {
    id: '',
    name: '',
    category: '宝可梦',
    ipTag: 'Pokémon',
    setName: '',
    rarity: '',
    valueGrade: 'A',
    marketValueUsd: 0,
    coinValue: 0,
    referenceImageUrl: '',
    physicalCount: 0,
    availableCount: 0,
    updatedAt: new Date().toISOString(),
  }
}

const categories = computed(() => [...new Set(rows.value.map((item) => item.category))])
const visibleRows = computed(() =>
  category.value ? rows.value.filter((item) => item.category === category.value) : rows.value,
)
const columns = computed<TableColumn[]>(() => [
  { key: 'card', label: t('phase2.style'), width: '25%' },
  { key: 'category', label: t('phase2.category') },
  { key: 'rarity', label: t('phase2.rarity') },
  { key: 'valueGrade', label: t('phase2.valueGradeLabel') },
  { key: 'marketValueUsd', label: `${t('phase2.marketValue')} (USD)` },
  { key: 'coinValue', label: t('phase2.coinValue') },
  { key: 'inventory', label: t('phase2.physicalCount') },
  { key: 'actions', label: t('phase2.actions') },
])
const tableRows = computed(() =>
  visibleRows.value.map((item) => ({
    ...item,
    card: item.name,
    inventory: item.physicalCount,
    actions: item.id,
  })),
)

async function load() {
  loading.value = true
  error.value = false
  await router.replace({
    query: {
      ...(keyword.value && { keyword: keyword.value }),
      ...(category.value && { category: category.value }),
      ...(page.value > 1 && { page: String(page.value) }),
    },
  })
  try {
    const result = await repositories.inventory.listCardStyles({
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
  category.value = ''
  page.value = 1
  void load()
}

function openCreate() {
  activeStyle.value = emptyStyle()
  editorOpen.value = true
}

function openEdit(style: CardStyle) {
  activeStyle.value = JSON.parse(JSON.stringify(style)) as CardStyle
  editorOpen.value = true
}

async function save(style: CardStyle) {
  busy.value = true
  notice.value = ''
  try {
    await repositories.inventory.saveCardStyle(style, createOperationContext())
    editorOpen.value = false
    notice.value = t('phase2.cardSaved')
    await load()
  } catch (caught) {
    notice.value = caught instanceof Error ? caught.message : t('phase2.operationFailed')
  } finally {
    busy.value = false
  }
}

function askDelete(style: CardStyle) {
  if (style.physicalCount > 0) return
  activeStyle.value = style
  deleteOpen.value = true
}

async function remove(payload: { reason: string; verificationCode: string }) {
  busy.value = true
  notice.value = ''
  try {
    await repositories.inventory.deleteCardStyle(
      activeStyle.value.id,
      payload.reason,
      payload.verificationCode,
      createOperationContext(),
    )
    deleteOpen.value = false
    notice.value = t('phase2.cardDeleted')
    await load()
  } catch (caught) {
    notice.value = caught instanceof Error ? caught.message : t('phase2.operationFailed')
  } finally {
    busy.value = false
  }
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
        <h1>{{ $t('phase2.cardStylesTitle') }}</h1>
        <p>{{ $t('phase2.cardStylesSubtitle') }}</p>
      </div>
      <button class="button button-primary" @click="openCreate">
        + {{ $t('phase2.addCardStyle') }}
      </button>
    </header>

    <p v-if="notice" class="notice-line" aria-live="polite">{{ notice }}</p>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset">
        <input
          v-model="keyword"
          class="input"
          :placeholder="$t('phase2.searchCardStyles')"
          @keyup.enter="load"
        />
        <select v-model="category" class="input" @change="page = 1">
          <option value="">{{ $t('phase2.category') }}</option>
          <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
        <template #actions>
          <button class="button button-primary" @click="load">{{ $t('common.search') }}</button>
        </template>
      </AppFilterBar>

      <AppSkeleton v-if="loading" />
      <AppErrorState v-else-if="error" @retry="load" />
      <AppEmptyState v-else-if="!visibleRows.length" />
      <template v-else>
        <AppDataTable :columns="columns" :rows="tableRows" row-key="id">
          <template #cell-card="{ row }">
            <div class="card-style-cell">
              <div class="card-thumb">
                <img
                  v-if="row.referenceImageUrl"
                  :src="String(row.referenceImageUrl)"
                  :alt="String(row.name)"
                />
                <span v-else aria-hidden="true">◇</span>
              </div>
              <div>
                <RouterLink
                  :to="{ name: 'card-style-detail', params: { styleId: String(row.id) } }"
                  >{{ row.name }}</RouterLink
                >
                <small>{{ row.id }} · {{ row.setName || '—' }}</small>
              </div>
            </div>
          </template>
          <template #cell-valueGrade="{ value }"
            ><span class="grade-pill">{{ value }}</span></template
          >
          <template #cell-marketValueUsd="{ value }">{{ n(Number(value), 'usd') }}</template>
          <template #cell-coinValue="{ value }"
            ><b class="coin-value">{{ n(Number(value), 'integer') }} Coin</b></template
          >
          <template #cell-inventory="{ row }"
            >{{ row.availableCount }} / {{ row.physicalCount }}</template
          >
          <template #cell-actions="{ row }">
            <div class="row-actions">
              <button class="text-button" @click="openEdit(row as unknown as CardStyle)">
                {{ $t('common.edit') }}
              </button>
              <button
                class="text-button text-danger"
                :disabled="Number(row.physicalCount) > 0"
                :title="
                  Number(row.physicalCount) > 0
                    ? $t('phase2.deleteDisabledInventory')
                    : $t('phase2.deleteCard')
                "
                @click="askDelete(row as unknown as CardStyle)"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </template>
        </AppDataTable>
        <AppPagination :page="page" :page-size="20" :total="total" @change="changePage" />
      </template>
    </section>

    <CardStyleEditorDialog
      :open="editorOpen"
      :style="activeStyle"
      :busy="busy"
      @close="editorOpen = false"
      @save="save"
    />
    <HighRiskConfirmDialog
      :open="deleteOpen"
      :busy="busy"
      :title="$t('phase2.deleteCardTitle')"
      :object-label="`${activeStyle.id} · ${activeStyle.name}`"
      :impact="$t('phase2.deleteCardImpact')"
      :consequence="$t('phase2.deleteCardConsequence')"
      confirmation-word="DELETE"
      :button-label="$t('phase2.deleteCard')"
      :reason-label="$t('phase2.reason')"
      :verification-label="$t('phase2.verification')"
      :confirmation-label="$t('phase2.deleteConfirmWord')"
      @close="deleteOpen = false"
      @confirm="remove"
    />
  </div>
</template>
