<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const code = ref('')
const error = ref('')
const destination = computed(() =>
  auth.authState.status === 'two_factor_required' ? auth.authState.challenge.destinationMasked : '',
)

async function submit() {
  if (auth.busy || !/^\d{6}$/.test(code.value)) return
  error.value = ''
  try {
    await auth.verifyTwoFactor(code.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch {
    error.value = t('auth.twoFactorError')
  }
}

async function back() {
  auth.authState = { status: 'anonymous' }
  await router.replace({ name: 'login' })
}
</script>

<template>
  <section class="auth-card">
    <span class="page-eyebrow">{{ $t('auth.twoFactorEyebrow') }}</span>
    <h1>{{ $t('auth.twoFactorTitle') }}</h1>
    <p>{{ $t('auth.twoFactorSubtitle', { destination }) }}</p>
    <form @submit.prevent="submit">
      <label class="field"
        ><span>{{ $t('auth.code') }}</span
        ><input
          v-model="code"
          class="code-input"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          required
          autofocus
      /></label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button
        class="button button-primary button-block"
        :disabled="auth.busy || !/^\d{6}$/.test(code)"
      >
        <span v-if="auth.busy" class="spinner" />{{ $t('auth.verify') }}
      </button>
    </form>
    <aside class="demo-credentials">
      <b>{{ $t('auth.demoCode') }}</b>
    </aside>
    <button class="text-button" @click="back">← {{ $t('auth.backToLogin') }}</button>
  </section>
</template>
