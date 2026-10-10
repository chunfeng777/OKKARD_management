<script setup lang="ts">
defineProps<{ title?: string; description?: string; requestId?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="state-panel state-error" role="alert">
    <span class="state-icon" aria-hidden="true">!</span>
    <h2>{{ title ?? $t('state.errorTitle') }}</h2>
    <p>{{ description ?? $t('state.errorDescription') }}</p>
    <code v-if="requestId">{{ requestId }}</code>
    <button class="button button-secondary" @click="$emit('retry')">
      {{ $t('common.retry') }}
    </button>
  </section>
</template>
