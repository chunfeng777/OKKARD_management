<script setup lang="ts">
import { dataSource } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()
const query = ref('')
const menuOpen = ref(false)
const appEnvironment = import.meta.env.VITE_APP_ENV ?? 'development'
const environmentKey = computed(() =>
  dataSource === 'mock' ? 'topbar.mock' : `topbar.${appEnvironment}`,
)

function search() {
  if (!query.value.trim()) return
  void router.push({ name: 'global-search', query: { q: query.value.trim() } })
}

async function signOut() {
  menuOpen.value = false
  await auth.signOut()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <header class="admin-topbar">
    <form class="global-search" role="search" @submit.prevent="search">
      <span aria-hidden="true">⌕</span>
      <input v-model="query" :placeholder="$t('topbar.globalSearch')" />
      <button type="submit" class="sr-only">{{ $t('common.search') }}</button>
    </form>
    <div class="topbar-actions">
      <span :class="['environment-badge', { mock: dataSource === 'mock' }]">{{
        $t(environmentKey)
      }}</span>
      <button class="todo-button" :aria-label="$t('topbar.todo')">
        <span aria-hidden="true">◌</span><i>6</i>
      </button>
      <div class="profile-menu">
        <button
          class="profile-trigger"
          :aria-expanded="menuOpen"
          :aria-label="$t('topbar.profile')"
          @click="menuOpen = !menuOpen"
        >
          <span>OP</span><b>{{ auth.currentAdmin?.name }}</b
          ><i aria-hidden="true">⌄</i>
        </button>
        <div v-if="menuOpen" class="profile-popover">
          <strong>{{ auth.currentAdmin?.name }}</strong>
          <small>{{ auth.currentAdmin?.emailMasked }}</small>
          <button @click="signOut">{{ $t('common.signOut') }}</button>
        </div>
      </div>
    </div>
  </header>
</template>
