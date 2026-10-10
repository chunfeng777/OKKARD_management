<script setup lang="ts">
import type { BatchValidationItem } from '@/domain/blind-box'

defineProps<{ items: BatchValidationItem[] }>()
</script>

<template>
  <section class="validation-panel">
    <div class="section-heading">
      <h2>{{ $t('phase2.validation') }}</h2>
    </div>
    <p v-if="!items.length" class="validation-stale">{{ $t('phase2.validationStale') }}</p>
    <ul>
      <li v-for="item in items" :key="item.key" :class="{ passed: item.passed }">
        <span aria-hidden="true">{{ item.passed ? '✓' : '!' }}</span>
        <span>{{ $t(`phase2.${item.key === 'schedule' ? 'scheduleCheck' : item.key}`) }}</span>
        <b>{{ item.passed ? $t('status.succeeded') : $t('phase2.blocked') }}</b>
      </li>
    </ul>
  </section>
</template>
