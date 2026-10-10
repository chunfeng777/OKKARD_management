<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import type { CardStyle, PhysicalCard } from '@/domain/inventory'
import { repositories } from '@/services'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { d, n } = useI18n()
const route = useRoute()
const item = ref<CardStyle | PhysicalCard>()
const loading = ref(true)
const error = ref(false)
const isStyle = computed(() => route.name === 'card-style-detail')
async function load() {
  loading.value = true
  error.value = false
  try {
    item.value = isStyle.value
      ? await repositories.inventory.getCardStyle(String(route.params.styleId))
      : await repositories.inventory.getPhysicalCard(String(route.params.physicalCardId))
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t(isStyle ? 'modules.cardStyleDetail' : 'modules.inventoryDetail') }}</h1>
        <p>{{ $t('phase2.uploadReserved') }}</p>
      </div>
    </header>
    <AppSkeleton v-if="loading" /><AppErrorState v-else-if="error" @retry="load" />
    <section v-else-if="item" class="panel detail-overview">
      <div class="detail-title">
        <div>
          <code>{{ item.id }}</code>
          <h2>
            {{ isStyle ? (item as CardStyle).name : (item as PhysicalCard).styleName }}
          </h2>
        </div>
        <AppStatusTag v-if="!isStyle" :status="(item as PhysicalCard).status" />
      </div>
      <dl v-if="isStyle" class="description-grid">
        <div>
          <dt>{{ $t('phase2.category') }}</dt>
          <dd>{{ (item as CardStyle).category }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.set') }}</dt>
          <dd>{{ (item as CardStyle).setName }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.rarity') }}</dt>
          <dd>{{ (item as CardStyle).rarity }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.valueGradeLabel') }}</dt>
          <dd>{{ (item as CardStyle).valueGrade }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.marketValue') }}</dt>
          <dd>{{ n((item as CardStyle).marketValueUsd, 'usd') }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.coinValue') }}</dt>
          <dd>{{ n((item as CardStyle).coinValue, 'integer') }} Coin</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.physicalCount') }}</dt>
          <dd>{{ n((item as CardStyle).physicalCount, 'integer') }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.availableCount') }}</dt>
          <dd>{{ n((item as CardStyle).availableCount, 'integer') }}</dd>
        </div>
      </dl>
      <dl v-else class="description-grid">
        <div>
          <dt>{{ $t('phase2.frontImage') }}</dt>
          <dd>{{ (item as PhysicalCard).frontImageUrl || $t('phase2.notUploaded') }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.backImage') }}</dt>
          <dd>{{ (item as PhysicalCard).backImageUrl || $t('phase2.notUploaded') }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.grade') }}</dt>
          <dd>{{ (item as PhysicalCard).gradingAgency }} {{ (item as PhysicalCard).grade }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.certificate') }}</dt>
          <dd>{{ (item as PhysicalCard).certificateMasked }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.condition') }}</dt>
          <dd>{{ (item as PhysicalCard).condition }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.location') }}</dt>
          <dd>{{ (item as PhysicalCard).location }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.reservedBatch') }}</dt>
          <dd>{{ (item as PhysicalCard).reservedBatchId ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('phase2.updatedAt') }}</dt>
          <dd>{{ d(new Date((item as PhysicalCard).updatedAt), 'short') }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
