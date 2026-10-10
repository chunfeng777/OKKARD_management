<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ status: string; label?: string }>()
const { t, te } = useI18n()
const tone = computed(() => {
  if (
    [
      'active',
      'normal',
      'succeeded',
      'available',
      'healthy',
      'completed',
      'on_sale',
      'sold_out',
      'shipped',
      'approved',
      'published',
      'delivered',
      'resolved',
    ].includes(props.status)
  )
    return 'success'
  if (
    [
      'attention',
      'warning',
      'processing',
      'pending_review',
      'scheduled',
      'paused',
      'pending_inspection',
      'return_inspection',
      'counting',
      'review',
      'reviewing',
      'manual_review',
      'pending_payment',
      'pending_template_allocation',
      'pending_pick',
      'packed',
      'in_transit',
      'waiting_user',
    ].includes(props.status)
  )
    return 'warning'
  if (
    [
      'high',
      'danger',
      'failed',
      'denied',
      'suspended',
      'damaged',
      'voided',
      'blocked',
      'rejected',
      'chargeback',
    ].includes(props.status)
  )
    return 'danger'
  return 'neutral'
})
const text = computed(
  () => props.label ?? (te(`status.${props.status}`) ? t(`status.${props.status}`) : props.status),
)
</script>

<template>
  <span :class="['status-tag', `status-${tone}`]"><i aria-hidden="true" />{{ text }}</span>
</template>
