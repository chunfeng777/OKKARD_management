<script setup lang="ts">
defineProps<{ moduleKey: string; phase?: number }>()
</script>

<template>
  <div class="page-stack">
    <section class="placeholder-panel panel">
      <span class="placeholder-icon" aria-hidden="true">◇</span>
      <span class="page-eyebrow">{{ $t('placeholder.phase') }} {{ phase ?? 2 }}</span>
      <h1>{{ $t('placeholder.title', { module: $t(`modules.${moduleKey}`) }) }}</h1>
      <p>{{ $t('placeholder.description') }}</p>
      <RouterLink :to="{ name: 'dashboard' }" class="button button-primary">{{
        $t('placeholder.back')
      }}</RouterLink>
    </section>
  </div>
</template>
