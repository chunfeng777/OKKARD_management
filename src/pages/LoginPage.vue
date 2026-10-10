<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const account = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  if (auth.busy) return
  error.value = ''
  try {
    await auth.signIn({ account: account.value.trim(), password: password.value })
    await router.push({ name: 'two-factor', query: { redirect: route.query.redirect } })
  } catch {
    error.value = t('auth.loginError')
  }
}
</script>

<template>
  <section class="auth-card">
    <span class="page-eyebrow">{{ $t('auth.eyebrow') }}</span>
    <h1>{{ $t('auth.title') }}</h1>
    <p>{{ $t('auth.subtitle') }}</p>
    <form @submit.prevent="submit">
      <label class="field"
        ><span>{{ $t('auth.account') }}</span
        ><input
          v-model="account"
          type="email"
          autocomplete="username"
          :placeholder="$t('auth.accountPlaceholder')"
          required
      /></label>
      <label class="field"
        ><span>{{ $t('auth.password') }}</span
        ><input v-model="password" type="password" autocomplete="current-password" required
      /></label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="button button-primary button-block" :disabled="auth.busy">
        <span v-if="auth.busy" class="spinner" />{{ $t('auth.signIn') }}
      </button>
    </form>
    <aside class="demo-credentials">
      <b>{{ $t('auth.demoTitle') }}</b
      ><span>{{ $t('auth.demoAccount') }}</span
      ><span>{{ $t('auth.demoPassword') }}</span>
    </aside>
    <small class="security-note">{{ $t('auth.securityNote') }}</small>
  </section>
</template>
