<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import BatchValidationList from '@/components/BatchValidationList.vue'
import HighRiskConfirmDialog from '@/components/HighRiskConfirmDialog.vue'
import type { BatchEvent, BlindBoxBatch } from '@/domain/blind-box'
import type { BatchStatus } from '@/domain/states'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

type ActionName =
  'submitReview' | 'approve' | 'reject' | 'launch' | 'pause' | 'resume' | 'soldOut' | 'archive'
const { d, n } = useI18n()
const route = useRoute()
const router = useRouter()
const batch = ref<BlindBoxBatch>()
const events = ref<BatchEvent[]>([])
const loading = ref(true)
const error = ref(false)
const dialogAction = ref<ActionName>()
const busy = ref(false)
const notice = ref('')
const id = computed(() => String(route.params.batchId))
const isSelfReview = computed(() => batch.value?.creatorId === 'ADM-0001')
const allPassed = computed(() => batch.value?.validation.every((item) => item.passed) ?? false)
const nextStatus: Partial<Record<ActionName, BatchStatus>> = {
  launch: 'on_sale',
  pause: 'paused',
  resume: 'on_sale',
  soldOut: 'sold_out',
  archive: 'archived',
}
const availableActions = computed<ActionName[]>(() => {
  const status = batch.value?.status
  if (status === 'draft') return ['submitReview']
  if (status === 'pending_review') return isSelfReview.value ? [] : ['approve', 'reject']
  if (status === 'scheduled') return ['launch', 'archive']
  if (status === 'on_sale') return ['pause', 'soldOut']
  if (status === 'paused') return ['resume', 'archive']
  if (status === 'sold_out') return ['archive']
  return []
})
async function load() {
  loading.value = true
  error.value = false
  try {
    ;[batch.value, events.value] = await Promise.all([
      repositories.blindBoxes.getBatch(id.value),
      repositories.blindBoxes.listBatchEvents(id.value),
    ])
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
async function confirm(payload: { reason: string; verificationCode: string }) {
  if (!batch.value || !dialogAction.value) return
  busy.value = true
  notice.value = ''
  try {
    const context = createOperationContext()
    if (dialogAction.value === 'submitReview')
      batch.value = await repositories.blindBoxes.submitReview(id.value, payload.reason, context)
    else if (dialogAction.value === 'approve' || dialogAction.value === 'reject')
      batch.value = await repositories.blindBoxes.reviewBatch(
        id.value,
        {
          decision: dialogAction.value,
          reason: payload.reason,
          verificationCode: payload.verificationCode,
        },
        context,
      )
    else
      batch.value = await repositories.blindBoxes.transitionBatch(
        id.value,
        nextStatus[dialogAction.value]!,
        payload.reason,
        payload.verificationCode,
        context,
      )
    events.value = await repositories.blindBoxes.listBatchEvents(id.value)
    notice.value = 'phase2.success'
    dialogAction.value = undefined
  } catch {
    notice.value = 'phase2.operationFailed'
  } finally {
    busy.value = false
  }
}
async function copyBatch() {
  if (!batch.value) return
  busy.value = true
  try {
    const copy = await repositories.blindBoxes.copyBatch(batch.value.id, createOperationContext())
    await router.push({ name: 'pool-editor', params: { batchId: copy.id } })
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>
          {{ $t(route.name === 'batch-review' ? 'phase2.reviewTitle' : 'phase2.batchDetail') }}
        </h1>
        <p>
          {{
            $t(route.name === 'batch-review' ? 'phase2.reviewSubtitle' : 'phase2.batchesSubtitle')
          }}
        </p>
      </div>
      <div v-if="batch" class="page-actions">
        <RouterLink
          class="button button-secondary"
          :to="{ name: 'pool-editor', params: { batchId: batch.id } }"
          >{{ $t('phase2.poolTitle') }}</RouterLink
        ><button class="button button-secondary" :disabled="busy" @click="copyBatch">
          {{ $t('phase2.copyBatch') }}
        </button>
      </div>
    </header>
    <AppSkeleton v-if="loading" /><AppErrorState v-else-if="error" @retry="load" /><template
      v-else-if="batch"
      ><div v-if="batch.firstPublishedAt" class="immutable-banner">
        🔒 {{ $t('phase2.immutable') }}
      </div>
      <div v-if="isSelfReview && batch.status === 'pending_review'" class="warning-banner">
        {{ $t('phase2.selfReview') }}
      </div>
      <section class="panel detail-overview">
        <div class="detail-title">
          <div>
            <code>{{ batch.id }}</code>
            <h2>{{ batch.productName }}</h2>
          </div>
          <AppStatusTag :status="batch.status" />
        </div>
        <dl class="description-grid">
          <div>
            <dt>{{ $t('phase2.creator') }}</dt>
            <dd>{{ batch.creatorId }}</dd>
          </div>
          <div>
            <dt>{{ $t('phase2.reviewer') }}</dt>
            <dd>{{ batch.reviewerId ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ $t('phase2.unitPrice') }}</dt>
            <dd>{{ n(batch.unitPriceCoin, 'integer') }} Coin</dd>
          </div>
          <div>
            <dt>{{ $t('phase2.remainingStock') }}</dt>
            <dd>
              {{ n(batch.remainingStock, 'integer') }} / {{ n(batch.initialStock, 'integer') }}
            </dd>
          </div>
          <div>
            <dt>{{ $t('phase2.schedule') }}</dt>
            <dd>{{ batch.scheduledAt ? d(new Date(batch.scheduledAt), 'short') : '—' }}</dd>
          </div>
          <div>
            <dt>{{ $t('phase2.requestId') }}</dt>
            <dd>
              <code>{{ batch.requestId }}</code>
            </dd>
          </div>
          <div class="wide">
            <dt>{{ $t('phase2.idempotencyKey') }}</dt>
            <dd>
              <code>{{ batch.idempotencyKey }}</code>
            </dd>
          </div>
        </dl>
      </section>
      <BatchValidationList :items="batch.validation" />
      <section class="panel action-panel">
        <div class="section-heading">
          <div>
            <h2>{{ $t('phase2.actions') }}</h2>
            <p>{{ allPassed ? $t('phase2.allPassed') : $t('phase2.blocked') }}</p>
          </div>
        </div>
        <div class="page-actions">
          <button
            v-for="action in availableActions"
            :key="action"
            class="button"
            :class="
              action === 'reject' || action === 'pause' || action === 'archive'
                ? 'button-danger'
                : 'button-primary'
            "
            :disabled="busy || (action === 'submitReview' && !allPassed)"
            @click="dialogAction = action"
          >
            {{ $t(`phase2.${action}`) }}
          </button>
        </div>
        <p v-if="notice" :class="notice === 'phase2.success' ? 'text-success' : 'text-danger'">
          {{ $t(notice) }}
        </p>
      </section>
      <section class="panel timeline-panel">
        <div class="section-heading">
          <h2>{{ $t('phase2.timeline') }}</h2>
        </div>
        <ol v-if="events.length" class="audit-timeline">
          <li v-for="event in events" :key="event.id">
            <span />
            <div>
              <b>{{ event.action }}</b>
              <p>{{ event.reason }}</p>
              <small
                >{{ event.operatorId }} · {{ d(new Date(event.createdAt), 'short') }} ·
                {{ event.requestId }}</small
              >
            </div>
          </li>
        </ol>
        <p v-else class="text-neutral">{{ $t('phase2.noEvents') }}</p>
      </section></template
    ><HighRiskConfirmDialog
      :open="Boolean(dialogAction)"
      :title="$t(dialogAction ? `phase2.${dialogAction}` : 'phase2.riskTitle')"
      :object-label="batch?.id ?? ''"
      :impact="$t('phase2.impact')"
      :consequence="$t('phase2.consequence')"
      :busy="busy"
      confirmation-word="CONFIRM"
      :button-label="$t(dialogAction ? `phase2.${dialogAction}` : 'common.confirm')"
      :reason-label="$t('phase2.reason')"
      :verification-label="$t('phase2.verification')"
      :confirmation-label="$t('phase2.confirmWord')"
      @close="dialogAction = undefined"
      @confirm="confirm"
    />
  </div>
</template>
