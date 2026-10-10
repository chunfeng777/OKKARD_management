<script setup lang="ts">
import AppDataTable, { type TableColumn } from '@/components/AppDataTable.vue'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import type { Administrator } from '@/domain/admin'
import { repositories } from '@/services'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, d } = useI18n()
const keyword = ref('')
const page = ref(1)
const total = ref(0)
const rows = ref<Administrator[]>([])
const loading = ref(true)
const error = ref(false)
const columns = computed<TableColumn[]>(() => [
  { key: 'id', label: t('admin.id') },
  { key: 'name', label: t('admin.name') },
  { key: 'emailMasked', label: t('admin.account') },
  { key: 'role', label: t('admin.role') },
  { key: 'twoFactorEnabled', label: t('admin.twoFactor') },
  { key: 'lastLoginAt', label: t('admin.lastLogin') },
  { key: 'status', label: t('admin.status') },
])
const tableRows = computed(() => rows.value.map((item) => ({ ...item })))

async function load() {
  loading.value = true
  error.value = false
  try {
    const result = await repositories.system.listAdministrators({
      page: page.value,
      pageSize: 20,
      keyword: keyword.value,
    })
    rows.value = result.items
    total.value = result.total
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
function reset() {
  keyword.value = ''
  page.value = 1
  void load()
}
function changePage(value: number) {
  page.value = value
  void load()
}
onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('admin.eyebrow') }}</span>
        <h1>{{ $t('admin.title') }}</h1>
        <p>{{ $t('admin.subtitle') }}</p>
      </div>
    </header>
    <section class="panel table-panel">
      <AppFilterBar @reset="reset"
        ><input
          v-model="keyword"
          class="input"
          :placeholder="$t('admin.search')"
          @keyup.enter="load"
        /><template #actions
          ><button class="button button-primary" @click="load">
            {{ $t('common.search') }}
          </button></template
        ></AppFilterBar
      >
      <AppSkeleton v-if="loading" />
      <AppErrorState v-else-if="error" @retry="load" />
      <AppEmptyState v-else-if="!rows.length" />
      <template v-else>
        <AppDataTable :columns="columns" :rows="tableRows" row-key="id">
          <template #cell-id="{ value }"
            ><code>{{ value }}</code></template
          >
          <template #cell-role
            ><span>{{ $t('admin.superAdmin') }}</span></template
          >
          <template #cell-twoFactorEnabled
            ><AppStatusTag status="active" :label="$t('admin.enabled')"
          /></template>
          <template #cell-lastLoginAt="{ value }">{{
            d(new Date(String(value)), 'short')
          }}</template>
          <template #cell-status="{ value }"><AppStatusTag :status="String(value)" /></template>
        </AppDataTable>
        <AppPagination :page="page" :page-size="20" :total="total" @change="changePage" />
      </template>
    </section>
  </div>
</template>
