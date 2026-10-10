<script setup lang="ts">
defineProps<{ active: 1 | 2 | 3 }>()
</script>

<template>
  <ol class="blind-box-workflow" :aria-label="$t('phase2.workflowTitle')">
    <li v-for="step in 3" :key="step" :class="{ active: step === active, complete: step < active }">
      <span>{{ step < active ? '✓' : step }}</span>
      <div>
        <b>{{ $t(`phase2.workflowStep${step}`) }}</b>
        <small>{{ $t(`phase2.workflowStep${step}Help`) }}</small>
      </div>
    </li>
  </ol>
</template>
