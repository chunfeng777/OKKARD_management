<script setup lang="ts">
import type { TrendPoint } from '@/domain/dashboard'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ points: TrendPoint[] }>()
const { t } = useI18n()
const width = 760
const height = 230
const padding = 28
const series = [
  { key: 'draws', color: '#0f6f67' },
  { key: 'recharge', color: '#d09a00' },
  { key: 'paidUsers', color: '#3178c6' },
  { key: 'coinNet', color: '#8b5cf6' },
] as const

const paths = computed(() =>
  series.map((item) => {
    const values = props.points.map((point) => point[item.key])
    const max = Math.max(...values, 1)
    const coordinates = values.map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2)
      const y = height - padding - (value / max) * (height - padding * 2)
      return `${x},${y}`
    })
    return { ...item, coordinates: coordinates.join(' '), latest: values.at(-1) ?? 0 }
  }),
)
</script>

<template>
  <figure class="trend-chart">
    <div class="chart-legend">
      <span v-for="item in paths" :key="item.key"
        ><i :style="{ background: item.color }" />{{ t(`dashboard.series.${item.key}`) }}
        <b>{{ item.latest.toLocaleString() }}</b></span
      >
    </div>
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="$t('dashboard.trendHelp')">
      <line
        v-for="line in 4"
        :key="line"
        :x1="padding"
        :x2="width - padding"
        :y1="line * 45"
        :y2="line * 45"
        class="grid-line"
      />
      <polyline
        v-for="item in paths"
        :key="item.key"
        :points="item.coordinates"
        :stroke="item.color"
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <text
        v-for="(point, index) in points"
        :key="point.label"
        :x="padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)"
        :y="height - 5"
        text-anchor="middle"
      >
        {{ point.label }}
      </text>
    </svg>
    <figcaption>{{ $t('dashboard.trendHelp') }}</figcaption>
  </figure>
</template>
