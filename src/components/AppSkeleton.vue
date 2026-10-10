<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })
</script>

<template>
  <div class="skeleton-stack" :aria-label="$t('common.loading')" aria-busy="true">
    <span
      v-for="index in rows"
      :key="index"
      class="skeleton-line"
      :style="{ width: `${100 - (index % 3) * 12}%` }"
    />
  </div>
</template>
