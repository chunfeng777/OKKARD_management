<script setup lang="ts">
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppStatusTag from '@/components/AppStatusTag.vue'
import { businessModuleKeys, businessModuleMeta } from '@/config/business-modules'
import type { BusinessRecord } from '@/domain/operations'
import { repositories } from '@/services'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.keyword ?? ''))
const searched = ref(Boolean(keyword.value))
const loading = ref(false)
const error = ref(false)
const rows = ref<BusinessRecord[]>([])

async function search() {
  const value = keyword.value.trim()
  searched.value = true
  rows.value = []
  await router.replace({ query: value ? { keyword: value } : {} })
  if (!value) return
  loading.value = true
  error.value = false
  try {
    const results = await Promise.all(
      businessModuleKeys.map((module) =>
        repositories.operations.listRecords(module, { page: 1, pageSize: 5, keyword: value }),
      ),
    )
    rows.value = results.flatMap((result) => result.items).slice(0, 50)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function detailTo(row: BusinessRecord) {
  const meta = businessModuleMeta[row.module]
  if (meta.detailRoute && meta.detailParam)
    return { name: meta.detailRoute, params: { [meta.detailParam]: row.id } }
  return { name: 'business-record-detail', params: { moduleKey: row.module, recordId: row.id } }
}

onMounted(() => {
  if (keyword.value) void search()
})
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">GLOBAL LOOKUP</span>
        <h1>{{ $t('modules.globalSearch') }}</h1>
        <p>{{ $t('search.subtitle') }}</p>
      </div>
    </header>
    <section class="panel global-search-panel">
      <div class="global-search-form">
        <input
          v-model="keyword"
          class="input"
          autofocus
          :placeholder="$t('topbar.globalSearch')"
          @keyup.enter="search"
        /><button
          class="button button-primary"
          :disabled="loading || !keyword.trim()"
          @click="search"
        >
          {{ $t('common.search') }}
        </button>
      </div>
      <AppSkeleton v-if="loading" :rows="7" />
      <AppErrorState v-else-if="error" @retry="search" />
      <AppEmptyState
        v-else-if="searched && !rows.length"
        :title="$t('search.noResultTitle')"
        :description="$t('search.noResultDescription')"
      />
      <div v-else-if="rows.length" class="search-results">
        <RouterLink
          v-for="row in rows"
          :key="`${row.module}-${row.id}`"
          :to="detailTo(row)"
          class="search-result-card"
        >
          <span>{{ businessModuleMeta[row.module].title }}</span>
          <div>
            <b>{{ row.title }}</b
            ><code>{{ row.id }}</code>
          </div>
          <AppStatusTag :status="row.status" /><i>›</i>
        </RouterLink>
      </div>
      <AppEmptyState
        v-else
        :title="$t('search.startTitle')"
        :description="$t('search.startDescription')"
      />
    </section>
  </div>
</template>
