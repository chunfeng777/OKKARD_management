<script setup lang="ts">
import AppSkeleton from '@/components/AppSkeleton.vue'
import type { BlindBoxProduct } from '@/domain/blind-box'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const products = ref<BlindBoxProduct[]>([])
const productId = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref('')
onMounted(async () => {
  try {
    const result = await repositories.blindBoxes.listProducts({ page: 1, pageSize: 100 })
    products.value = result.items
    productId.value = result.items[0]?.id ?? ''
  } finally {
    loading.value = false
  }
})
async function create() {
  if (!productId.value) return
  busy.value = true
  error.value = ''
  try {
    const batch = await repositories.blindBoxes.createDraft(
      productId.value,
      createOperationContext(),
    )
    await router.push({ name: 'pool-editor', params: { batchId: batch.id } })
  } catch {
    error.value = 'phase2.operationFailed'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t('phase2.batchCreate') }}</h1>
        <p>{{ $t('phase2.batchesSubtitle') }}</p>
      </div>
    </header>
    <AppSkeleton v-if="loading" />
    <form v-else class="panel compact-form" @submit.prevent="create">
      <label class="field"
        ><span>{{ $t('phase2.product') }}</span
        ><select v-model="productId" required>
          <option v-for="product in products" :key="product.id" :value="product.id">
            {{ product.id }} · {{ product.name }}
          </option>
        </select></label
      >
      <p v-if="error" class="text-danger">{{ $t(error) }}</p>
      <button class="button button-primary" :disabled="busy || !productId">
        <span v-if="busy" class="spinner" />{{ $t('phase2.batchCreate') }}
      </button>
    </form>
  </div>
</template>
