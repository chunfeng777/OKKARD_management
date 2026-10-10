<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  width?: string
}

defineProps<{
  columns: TableColumn[]
  rows: Array<Record<string, unknown>>
  rowKey: string
}>()
</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width }"
            scope="col"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="String(row[rowKey])">
          <td v-for="column in columns" :key="column.key" :data-label="column.label">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{
              row[column.key]
            }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
