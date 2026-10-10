<script setup lang="ts">
const props = defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const next = () => emit('change', props.page + 1)
const previous = () => emit('change', props.page - 1)
</script>

<template>
  <nav class="pagination" :aria-label="$t('common.page', { page })">
    <span>{{ $t('common.total', { total }) }}</span>
    <button class="button button-ghost" :disabled="page <= 1" @click="previous">
      {{ $t('common.previous') }}
    </button>
    <b>{{ $t('common.page', { page }) }}</b>
    <button class="button button-ghost" :disabled="page * pageSize >= total" @click="next">
      {{ $t('common.next') }}
    </button>
  </nav>
</template>
