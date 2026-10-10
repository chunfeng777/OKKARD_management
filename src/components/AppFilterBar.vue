<script setup lang="ts">
defineEmits<{ reset: [] }>()
</script>

<template>
  <form class="filter-bar" @submit.prevent>
    <div class="filter-fields"><slot /></div>
    <div class="filter-actions">
      <button type="button" class="button button-ghost" @click="$emit('reset')">
        {{ $t('common.reset') }}
      </button>
      <slot name="actions" />
    </div>
  </form>
</template>
