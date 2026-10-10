<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppTrendChart from '@/components/AppTrendChart.vue'
import type { DashboardSnapshot } from '@/domain/dashboard'
import { repositories } from '@/services'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { d } = useI18n()
const loading = ref(true)
const error = ref(false)
const snapshot = ref<DashboardSnapshot | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    snapshot.value = await repositories.system.getDashboard()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('dashboard.eyebrow') }}</span>
        <h1>{{ $t('dashboard.title') }}</h1>
        <p>{{ $t('dashboard.subtitle') }}</p>
      </div>
      <small v-if="snapshot">{{
        $t('dashboard.updatedAt', { time: d(new Date(snapshot.generatedAt), 'short') })
      }}</small>
    </header>
    <AppSkeleton v-if="loading" :rows="8" />
    <AppErrorState v-else-if="error" @retry="load" />
    <template v-else-if="snapshot">
      <section>
        <div class="section-heading">
          <h2>{{ $t('dashboard.metrics') }}</h2>
        </div>
        <div class="metric-grid">
          <RouterLink
            v-for="metric in snapshot.metrics"
            :key="metric.key"
            :to="metric.route"
            class="metric-card panel"
          >
            <span>{{ $t(`dashboard.metric.${metric.key}`) }}</span
            ><strong>{{ metric.value }}</strong
            ><small :class="`text-${metric.tone}`">{{ metric.delta }}</small
            ><i aria-hidden="true">→</i>
          </RouterLink>
        </div>
      </section>
      <div class="dashboard-grid">
        <section class="panel chart-panel">
          <div class="section-heading">
            <div>
              <h2>{{ $t('dashboard.trend') }}</h2>
              <p>{{ $t('dashboard.trendHelp') }}</p>
            </div>
          </div>
          <AppTrendChart :points="snapshot.trend" />
        </section>
        <section class="panel todo-panel">
          <div class="section-heading">
            <h2>{{ $t('dashboard.todos') }}</h2>
          </div>
          <RouterLink v-for="todo in snapshot.todos" :key="todo.key" :to="todo.route">
            <span :class="['todo-dot', `dot-${todo.level}`]" aria-hidden="true" /><b>{{
              $t(`dashboard.todo.${todo.key}`)
            }}</b
            ><strong>{{ todo.count }}</strong
            ><i>→</i>
          </RouterLink>
        </section>
      </div>
    </template>
  </div>
</template>
