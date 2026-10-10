<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <RouterView />
  <div class="toast-region" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <article v-for="item in ui.toasts" :key="item.id" :class="['toast', `toast-${item.kind}`]">
        <strong>{{ item.title }}</strong>
        <span>{{ item.message }}</span>
        <button :aria-label="$t('common.close')" @click="ui.dismissToast(item.id)">×</button>
      </article>
    </TransitionGroup>
  </div>
</template>
