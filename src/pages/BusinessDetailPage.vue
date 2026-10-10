<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import HighRiskConfirmDialog from '@/components/HighRiskConfirmDialog.vue'
import { businessModuleMeta } from '@/config/business-modules'
import type {
  BusinessAction,
  BusinessModuleKey,
  BusinessRecord,
  BusinessSection,
} from '@/domain/operations'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { useUiStore } from '@/stores/ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ moduleKey?: BusinessModuleKey }>()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { d } = useI18n()
const routeModuleMap: Record<string, BusinessModuleKey> = {
  'user-detail': 'users',
  'recharge-detail': 'recharges',
  'draw-order-detail': 'drawOrders',
  'recycle-detail': 'recycles',
  'shipment-detail': 'shipments',
  'ticket-detail': 'tickets',
  'content-release': 'contentRelease',
}
const moduleKey = computed<BusinessModuleKey>(
  () =>
    props.moduleKey ??
    routeModuleMap[String(route.name)] ??
    (String(route.params.moduleKey) as BusinessModuleKey),
)
const meta = computed(() => businessModuleMeta[moduleKey.value])
const recordId = computed(() =>
  String(
    route.params.uid ??
      route.params.orderId ??
      route.params.shipmentId ??
      route.params.ticketId ??
      route.params.releaseId ??
      route.params.recordId ??
      '',
  ),
)
const record = ref<BusinessRecord | null>(null)
const activeSection = ref('overview')
const loading = ref(true)
const error = ref(false)
const requestId = ref('')
const selectedAction = ref<BusinessAction | null>(null)
const busy = ref(false)
const copied = ref('')
const editing = ref(false)
const draftSections = ref<BusinessSection[]>([])
const saveReason = ref('')
const editableModules: BusinessModuleKey[] = [
  'banners',
  'homeSections',
  'faq',
  'staticPages',
  'localization',
  'notificationTemplates',
  'systemSettings',
  'tickets',
]
const canEdit = computed(() => editableModules.includes(moduleKey.value))
const editableSections = computed(() =>
  draftSections.value.filter((section) => !['overview', 'trace'].includes(section.key)),
)

async function load() {
  loading.value = true
  error.value = false
  try {
    record.value = await repositories.operations.getRecord(moduleKey.value, recordId.value)
    draftSections.value = JSON.parse(JSON.stringify(record.value.sections)) as BusinessSection[]
    activeSection.value = record.value.sections[0]?.key ?? 'overview'
  } catch (reason) {
    error.value = true
    requestId.value =
      reason instanceof Error && 'requestId' in reason ? String(reason.requestId) : ''
  } finally {
    loading.value = false
  }
}

function startEdit() {
  if (!record.value) return
  draftSections.value = JSON.parse(JSON.stringify(record.value.sections)) as BusinessSection[]
  saveReason.value = ''
  editing.value = true
}

async function saveDraft() {
  if (!record.value || saveReason.value.trim().length < 5) return
  busy.value = true
  try {
    record.value = await repositories.operations.saveRecord(moduleKey.value, record.value.id, {
      sections: draftSections.value,
      reason: saveReason.value.trim(),
      context: createOperationContext(),
    })
    editing.value = false
    ui.showToast('success', '配置已保存', '已生成新的草稿与审计记录。')
  } catch (reason) {
    ui.showToast('danger', '保存失败', reason instanceof Error ? reason.message : '请稍后重试。')
  } finally {
    busy.value = false
  }
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
  copied.value = value
  window.setTimeout(() => (copied.value = ''), 1200)
}

async function confirm(payload: { reason: string; verificationCode: string }) {
  if (!record.value || !selectedAction.value) return
  busy.value = true
  try {
    record.value = await repositories.operations.executeAction(moduleKey.value, record.value.id, {
      action: selectedAction.value.key,
      ...payload,
      context: createOperationContext(),
    })
    ui.showToast('success', '操作已完成', '服务端状态已更新，审计时间线已追加。')
    selectedAction.value = null
  } catch (reason) {
    ui.showToast(
      'danger',
      '操作未完成',
      reason instanceof Error ? reason.message : '请查询最终状态后重试。',
    )
  } finally {
    busy.value = false
  }
}

watch(recordId, load)
onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <button class="text-button back-button" @click="router.back()">
          ← {{ $t('operations.backToList') }}
        </button>
        <h1>{{ record?.title ?? meta.title }}</h1>
        <p>{{ record?.id ?? $t('common.loading') }}</p>
      </div>
      <div v-if="record" class="page-actions">
        <AppStatusTag :status="record.status" />
        <button v-if="canEdit && !editing" class="button button-secondary" @click="startEdit">
          {{ $t('common.edit') }}
        </button>
        <button
          v-for="action in record.actions"
          :key="action.key"
          :class="['button', action.tone === 'danger' ? 'button-danger' : 'button-primary']"
          :disabled="busy"
          @click="selectedAction = action"
        >
          {{ action.label }}
        </button>
      </div>
    </header>

    <AppSkeleton v-if="loading" :rows="8" />
    <AppErrorState v-else-if="error" :request-id="requestId" @retry="load" />
    <template v-else-if="record">
      <section class="panel record-overview">
        <div>
          <small>{{ $t('operations.status') }}</small
          ><AppStatusTag :status="record.status" />
        </div>
        <div>
          <small>{{ $t('operations.risk') }}</small
          ><AppStatusTag :status="record.risk" />
        </div>
        <div>
          <small>Request ID</small
          ><span class="copy-cell"
            ><code>{{ record.requestId }}</code
            ><button class="text-button" @click="copy(record.requestId)">
              {{ copied === record.requestId ? $t('common.copied') : $t('common.copy') }}
            </button></span
          >
        </div>
        <div>
          <small>{{ $t('operations.idempotencyKey') }}</small
          ><span class="copy-cell"
            ><code>{{ record.idempotencyKey }}</code
            ><button class="text-button" @click="copy(record.idempotencyKey)">
              {{ copied === record.idempotencyKey ? $t('common.copied') : $t('common.copy') }}
            </button></span
          >
        </div>
        <div>
          <small>{{ $t('operations.updatedAt') }}</small
          ><b>{{ d(new Date(record.updatedAt), 'short') }}</b>
        </div>
      </section>

      <section class="panel record-detail-panel">
        <nav class="record-tabs" :aria-label="$t('operations.detailTabs')">
          <button
            v-for="section in record.sections"
            :key="section.key"
            :class="{ active: activeSection === section.key }"
            @click="activeSection = section.key"
          >
            {{ section.title }}
          </button>
        </nav>
        <template v-for="section in record.sections" :key="section.key">
          <dl v-if="section.key === activeSection" class="description-grid">
            <div v-for="field in section.fields" :key="field.label">
              <dt>
                {{ field.label }}
                <span v-if="field.sensitive" class="masked-label">{{
                  $t('operations.masked')
                }}</span>
              </dt>
              <dd>
                <span>{{ field.value }}</span
                ><button v-if="field.copyable" class="text-button" @click="copy(field.value)">
                  {{ copied === field.value ? $t('common.copied') : $t('common.copy') }}
                </button>
              </dd>
            </div>
          </dl>
        </template>
      </section>

      <section v-if="editing" class="panel configuration-editor">
        <div class="section-heading">
          <div>
            <h2>{{ $t('operations.editConfiguration') }}</h2>
            <p>{{ $t('operations.editHint') }}</p>
          </div>
        </div>
        <div v-for="section in editableSections" :key="section.key" class="configuration-section">
          <h3>{{ section.title }}</h3>
          <div class="form-grid">
            <label v-for="field in section.fields" :key="field.label" class="field">
              <span>{{ field.label }}</span>
              <input v-model="field.value" class="input" />
            </label>
          </div>
        </div>
        <label class="field">
          <span>{{ $t('operations.saveReason') }}</span>
          <textarea
            v-model="saveReason"
            rows="3"
            :placeholder="$t('operations.saveReasonPlaceholder')"
          />
        </label>
        <footer class="form-footer page-actions">
          <button class="button button-secondary" :disabled="busy" @click="editing = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="button button-primary"
            :disabled="busy || saveReason.trim().length < 5"
            @click="saveDraft"
          >
            {{ $t('operations.saveDraft') }}
          </button>
        </footer>
      </section>

      <section class="panel timeline-panel">
        <div class="section-heading">
          <div>
            <h2>{{ $t('operations.timeline') }}</h2>
            <p>{{ $t('operations.timelineHint') }}</p>
          </div>
        </div>
        <ol class="audit-timeline">
          <li v-for="event in record.timeline" :key="event.id">
            <i aria-hidden="true" />
            <div>
              <b>{{ event.action }}</b
              ><span>{{ event.operator }} · {{ d(new Date(event.createdAt), 'short') }}</span>
              <p>{{ event.reason }}</p>
              <code>{{ event.requestId }}</code>
            </div>
            <AppStatusTag :status="event.result" />
          </li>
        </ol>
      </section>
    </template>

    <HighRiskConfirmDialog
      v-if="selectedAction && record"
      :open="Boolean(selectedAction)"
      :title="selectedAction.label"
      :object-label="record.id"
      :impact="$t('operations.operationImpact')"
      :consequence="selectedAction.consequence"
      :confirmation-word="selectedAction.confirmationWord"
      :button-label="selectedAction.label"
      :busy="busy"
      :confirmation-label="$t('operations.confirmWord', { word: selectedAction.confirmationWord })"
      :reason-label="$t('operations.actionReason')"
      @close="selectedAction = null"
      @confirm="confirm"
    />
  </div>
</template>
