<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <section class="state-panel" role="status">
    <span class="state-icon" aria-hidden="true">◇</span>
    <h2>{{ title ?? $t('state.emptyTitle') }}</h2>
    <p>{{ description ?? $t('state.emptyDescription') }}</p>
    <slot />
  </section>
</template>
