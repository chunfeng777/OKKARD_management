<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  objectLabel: string
  impact: string
  consequence: string
  busy?: boolean
  confirmationWord?: string
  buttonLabel?: string
  reasonLabel?: string
  verificationLabel?: string
  confirmationLabel?: string
}>()
const emit = defineEmits<{
  close: []
  confirm: [payload: { reason: string; verificationCode: string }]
}>()

const reason = ref('')
const verificationCode = ref('')
const confirmation = ref('')
const valid = computed(
  () =>
    reason.value.trim().length >= 5 &&
    /^\d{6}$/.test(verificationCode.value) &&
    confirmation.value === (props.confirmationWord ?? 'REVOKE'),
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      reason.value = ''
      verificationCode.value = ''
      confirmation.value = ''
    }
  },
)

function submit() {
  if (!valid.value || props.busy) return
  emit('confirm', { reason: reason.value.trim(), verificationCode: verificationCode.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" @click.self="$emit('close')">
      <section
        class="dialog danger-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${objectLabel}-dialog-title`"
      >
        <header>
          <span class="danger-mark" aria-hidden="true">!</span>
          <div>
            <small>{{ objectLabel }}</small>
            <h2 :id="`${objectLabel}-dialog-title`">{{ title }}</h2>
          </div>
          <button class="icon-button" :aria-label="$t('common.close')" @click="$emit('close')">
            ×
          </button>
        </header>
        <div class="impact-box">
          <b>{{ impact }}</b>
          <p>{{ consequence }}</p>
        </div>
        <form @submit.prevent="submit">
          <label class="field"
            ><span>{{ reasonLabel ?? $t('session.revokeReason') }}</span
            ><textarea
              v-model="reason"
              rows="3"
              :placeholder="$t('session.reasonPlaceholder')"
              required
            />
          </label>
          <label class="field"
            ><span>{{ verificationLabel ?? $t('session.verification') }}</span
            ><input
              v-model="verificationCode"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              required
          /></label>
          <label class="field"
            ><span>{{ confirmationLabel ?? $t('session.confirmation') }}</span
            ><input v-model="confirmation" autocomplete="off" required
          /></label>
          <footer>
            <button
              type="button"
              class="button button-secondary"
              :disabled="busy"
              @click="$emit('close')"
            >
              {{ $t('common.cancel') }}
            </button>
            <button type="submit" class="button button-danger" :disabled="!valid || busy">
              <span v-if="busy" class="spinner" />{{ buttonLabel ?? $t('common.revoke') }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
