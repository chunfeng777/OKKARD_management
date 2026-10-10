<script setup lang="ts">
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import BatchValidationList from '@/components/BatchValidationList.vue'
import BlindBoxWorkflowSteps from '@/components/BlindBoxWorkflowSteps.vue'
import type { BlindBoxBatch, PoolItem } from '@/domain/blind-box'
import { isBatchCoreLocked, previewProbability } from '@/domain/batch-rules'
import type { CardStyle, PhysicalCard } from '@/domain/inventory'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { n, t } = useI18n()
const route = useRoute()
const batch = ref<BlindBoxBatch>()
const cardStyles = ref<CardStyle[]>([])
const physicalCards = ref<PhysicalCard[]>([])
const loading = ref(true)
const error = ref(false)
const saving = ref(false)
const notice = ref('')
const libraryOpen = ref(false)
const libraryKeyword = ref('')
const bindings = reactive<Record<string, string>>({})
const locked = computed(
  () => !batch.value || batch.value.status !== 'draft' || isBatchCoreLocked(batch.value),
)
const styleById = computed(() => new Map(cardStyles.value.map((style) => [style.id, style])))
const previewRemaining = (item: PoolItem) =>
  locked.value ? item.remaining : Number(item.quota) || 0
const totalRemaining = computed(
  () => batch.value?.pool.reduce((sum, item) => sum + previewRemaining(item), 0) ?? 0,
)
const totalProbability = computed(
  () =>
    batch.value?.pool.reduce(
      (sum, item) => sum + previewProbability(previewRemaining(item), totalRemaining.value),
      0,
    ) ?? 0,
)
const usedPhysicalIds = computed(
  () => new Set(batch.value?.pool.flatMap((item) => item.physicalCardIds) ?? []),
)
const filteredStyles = computed(() => {
  const keyword = libraryKeyword.value.trim().toLowerCase()
  if (!keyword) return cardStyles.value
  return cardStyles.value.filter((style) =>
    `${style.id} ${style.name} ${style.category} ${style.rarity} ${style.setName}`
      .toLowerCase()
      .includes(keyword),
  )
})

function styleFor(item: PoolItem) {
  return item.styleId ? styleById.value.get(item.styleId) : undefined
}

function availablePhysical(styleId: string) {
  return physicalCards.value.filter(
    (card) =>
      card.styleId === styleId &&
      card.status === 'available' &&
      !usedPhysicalIds.value.has(card.id),
  )
}

function syncBindings() {
  if (!batch.value) return
  for (const item of batch.value.pool)
    bindings[item.id] =
      item.kind === 'explicit_card' ? item.physicalCardIds.join(', ') : (item.templatePoolId ?? '')
}

function markValidationStale() {
  if (batch.value) batch.value.validation = []
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const [loadedBatch, styles, cards] = await Promise.all([
      repositories.blindBoxes.getBatch(String(route.params.batchId)),
      repositories.inventory.listCardStyles({ page: 1, pageSize: 200 }),
      repositories.inventory.listPhysicalCards({ page: 1, pageSize: 500 }),
    ])
    batch.value = loadedBatch
    cardStyles.value = styles.items
    physicalCards.value = cards.items
    syncBindings()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function addTemplate() {
  if (!batch.value || locked.value) return
  const id = `POOL-${crypto.randomUUID()}`
  batch.value.pool.push({
    id,
    tier: 'A',
    kind: 'template',
    label: '2,000 Coin 保底模板',
    quota: 1,
    remaining: 1,
    lockedCoin: 2000,
    physicalCardIds: [],
    templatePoolId: 'TPL-2000-A',
  })
  bindings[id] = 'TPL-2000-A'
  markValidationStale()
}

function addStyle(style: CardStyle) {
  if (!batch.value || locked.value) return
  const physicalCard = availablePhysical(style.id)[0]
  if (!physicalCard) {
    notice.value = t('phase2.noAvailablePhysicalCard')
    return
  }
  const id = `POOL-${crypto.randomUUID()}`
  batch.value.pool.push({
    id,
    styleId: style.id,
    tier: style.valueGrade,
    kind: 'explicit_card',
    label: style.name,
    quota: 1,
    remaining: 1,
    lockedCoin: style.coinValue,
    physicalCardIds: [physicalCard.id],
  })
  bindings[id] = physicalCard.id
  libraryOpen.value = false
  libraryKeyword.value = ''
  notice.value = t('phase2.cardAddedToPool')
  markValidationStale()
}

function removeItem(id: string) {
  if (!batch.value || locked.value) return
  batch.value.pool = batch.value.pool.filter((item) => item.id !== id)
  delete bindings[id]
  markValidationStale()
}

async function save() {
  if (!batch.value || locked.value) return
  saving.value = true
  notice.value = ''
  try {
    for (const item of batch.value.pool) {
      item.remaining = item.quota
      if (item.kind === 'explicit_card')
        item.physicalCardIds = bindings[item.id]
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      else item.templatePoolId = bindings[item.id].trim()
    }
    batch.value.remainingStock = batch.value.initialStock
    batch.value = await repositories.blindBoxes.saveDraft(batch.value, createOperationContext())
    syncBindings()
    notice.value = t('phase2.success')
  } catch (caught) {
    notice.value = caught instanceof Error ? caught.message : t('phase2.operationFailed')
  } finally {
    saving.value = false
  }
}

async function validate() {
  if (!batch.value || locked.value) return
  await save()
}

onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t('phase2.poolTitle') }}</h1>
        <p>{{ $t('phase2.poolSubtitle') }}</p>
      </div>
      <RouterLink
        v-if="batch"
        class="button button-secondary"
        :to="{ name: 'batch-detail', params: { batchId: batch.id } }"
        >{{ $t('phase2.batchDetail') }}</RouterLink
      >
    </header>

    <BlindBoxWorkflowSteps :active="3" />

    <AppSkeleton v-if="loading" />
    <AppErrorState v-else-if="error" @retry="load" />
    <template v-else-if="batch">
      <div v-if="locked" class="immutable-banner">🔒 {{ $t('phase2.immutable') }}</div>
      <p v-if="notice" class="notice-line" aria-live="polite">{{ notice }}</p>
      <section class="panel pool-editor">
        <div class="pool-meta">
          <label class="field"
            ><span>{{ $t('phase2.initialStock') }}</span
            ><input
              v-model.number="batch.initialStock"
              type="number"
              min="1"
              :disabled="locked"
              @input="markValidationStale"
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.unitPrice') }}</span
            ><input v-model.number="batch.unitPriceCoin" type="number" min="1" :disabled="locked"
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.schedule') }}</span
            ><input
              v-model="batch.scheduledAt"
              type="datetime-local"
              :disabled="locked"
              @input="markValidationStale"
          /></label>
        </div>

        <div
          class="probability-summary"
          :class="{ complete: Math.abs(totalProbability - 1) < 0.0001 }"
        >
          <div>
            <b
              >✓ {{ $t('phase2.probabilityTotal') }}：{{
                n(totalProbability, {
                  style: 'percent',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}</b
            >
            <small>{{ $t('phase2.probabilityComplete') }}</small>
          </div>
          <div class="row-actions">
            <button class="button button-secondary" :disabled="locked" @click="libraryOpen = true">
              + {{ $t('phase2.chooseFromLibrary') }}
            </button>
            <button class="button button-primary" :disabled="locked || saving" @click="save">
              <span v-if="saving" class="spinner" />{{ $t('phase2.saveConfiguration') }}
            </button>
          </div>
        </div>

        <div class="pool-table-wrap">
          <table class="data-table pool-table pool-detail-table">
            <thead>
              <tr>
                <th>{{ $t('phase2.style') }}</th>
                <th>{{ $t('phase2.rarity') }}</th>
                <th>{{ $t('phase2.valueGradeLabel') }}</th>
                <th>{{ $t('phase2.quantity') }}</th>
                <th>{{ $t('phase2.remaining') }}</th>
                <th>{{ $t('phase2.marketValue') }}</th>
                <th>{{ $t('phase2.coinValue') }}</th>
                <th>{{ $t('phase2.probabilityPercent') }}</th>
                <th>{{ $t('phase2.binding') }}</th>
                <th>{{ $t('phase2.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in batch.pool" :key="item.id">
                <td>
                  <div class="card-style-cell compact">
                    <div class="card-thumb">
                      <img
                        v-if="styleFor(item)?.referenceImageUrl"
                        :src="styleFor(item)?.referenceImageUrl"
                        :alt="item.label"
                      /><span v-else aria-hidden="true">◇</span>
                    </div>
                    <div>
                      <b>{{ item.label }}</b
                      ><small>{{
                        item.kind === 'template' ? $t('phase2.template') : item.styleId
                      }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ styleFor(item)?.rarity ?? $t('phase2.template') }}</td>
                <td>
                  <span class="grade-pill">{{ item.tier }}</span>
                </td>
                <td>
                  <input
                    v-model.number="item.quota"
                    type="number"
                    min="1"
                    :disabled="locked"
                    @input="markValidationStale"
                  />
                </td>
                <td>
                  <b>{{ previewRemaining(item) }}</b> / {{ item.quota }}
                </td>
                <td>{{ styleFor(item) ? n(styleFor(item)!.marketValueUsd, 'usd') : '—' }}</td>
                <td>
                  <input
                    v-model.number="item.lockedCoin"
                    type="number"
                    min="0"
                    :disabled="locked"
                    @input="markValidationStale"
                  />
                </td>
                <td>
                  <b>{{
                    n(previewProbability(previewRemaining(item), totalRemaining), {
                      style: 'percent',
                      maximumFractionDigits: 2,
                    })
                  }}</b>
                  <div class="probability-bar">
                    <i
                      :style="{
                        width: `${previewProbability(previewRemaining(item), totalRemaining) * 100}%`,
                      }"
                    />
                  </div>
                </td>
                <td>
                  <input
                    v-model="bindings[item.id]"
                    :disabled="locked || item.kind === 'explicit_card'"
                    @input="markValidationStale"
                  />
                </td>
                <td>
                  <button
                    class="text-button text-danger"
                    :disabled="locked"
                    :aria-label="$t('common.delete')"
                    @click="removeItem(item.id)"
                  >
                    ×
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="pool-add-row" :disabled="locked" @click="libraryOpen = true">
          + {{ $t('phase2.addFromLibrary') }}
        </button>
        <div class="page-actions">
          <button class="button button-secondary" :disabled="locked" @click="addTemplate">
            + {{ $t('phase2.template') }}
          </button>
          <button class="button button-ghost" @click="validate">{{ $t('phase2.validate') }}</button>
          <button class="button button-primary" :disabled="locked || saving" @click="save">
            <span v-if="saving" class="spinner" />{{ $t('phase2.saveConfiguration') }}
          </button>
        </div>
      </section>
      <BatchValidationList :items="batch.validation" />
    </template>

    <Teleport to="body">
      <div v-if="libraryOpen" class="dialog-backdrop" @click.self="libraryOpen = false">
        <section
          class="dialog card-library-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-library-title"
        >
          <header>
            <div>
              <small>{{ $t('phase2.explicitCard') }}</small>
              <h2 id="card-library-title">{{ $t('phase2.cardLibraryTitle') }}</h2>
            </div>
            <button
              class="icon-button"
              :aria-label="$t('common.close')"
              @click="libraryOpen = false"
            >
              ×
            </button>
          </header>
          <p>{{ $t('phase2.cardLibrarySubtitle') }}</p>
          <input
            v-model="libraryKeyword"
            class="input library-search"
            :placeholder="$t('phase2.searchCardStyles')"
          />
          <AppEmptyState v-if="!filteredStyles.length" />
          <div v-else class="library-list">
            <article v-for="style in filteredStyles" :key="style.id" class="library-card">
              <div class="card-thumb large">
                <img
                  v-if="style.referenceImageUrl"
                  :src="style.referenceImageUrl"
                  :alt="style.name"
                /><span v-else aria-hidden="true">◇</span>
              </div>
              <div>
                <b>{{ style.name }}</b
                ><small>{{ style.category }} · {{ style.rarity }} · {{ style.valueGrade }}</small
                ><small
                  >{{ n(style.marketValueUsd, 'usd') }} · {{ n(style.coinValue, 'integer') }} Coin ·
                  {{ $t('phase2.availableCount') }} {{ availablePhysical(style.id).length }}</small
                >
              </div>
              <button
                class="button button-secondary"
                :disabled="!availablePhysical(style.id).length"
                :title="
                  !availablePhysical(style.id).length
                    ? $t('phase2.noAvailablePhysicalCard')
                    : $t('phase2.selectCard')
                "
                @click="addStyle(style)"
              >
                {{ $t('phase2.selectCard') }}
              </button>
            </article>
          </div>
          <footer>
            <RouterLink
              class="button button-secondary"
              :to="{ name: 'card-styles' }"
              @click="libraryOpen = false"
              >+ {{ $t('phase2.createLibraryCard') }}</RouterLink
            ><button class="button button-ghost" @click="libraryOpen = false">
              {{ $t('common.cancel') }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>
