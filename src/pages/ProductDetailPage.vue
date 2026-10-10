<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import BlindBoxWorkflowSteps from '@/components/BlindBoxWorkflowSteps.vue'
import type { BlindBoxProduct } from '@/domain/blind-box'
import { repositories } from '@/services'
import { createOperationContext } from '@/services/operation'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const blank = (): BlindBoxProduct => ({
  id: '',
  slug: '',
  name: '',
  type: '',
  description: '',
  tags: [],
  coverUrl: '',
  galleryUrls: [],
  seoTitle: '',
  enabled: false,
  updatedAt: new Date().toISOString(),
})
const product = ref<BlindBoxProduct>(blank())
const tagsText = ref('')
const galleryText = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref(false)
const notice = ref('')
const isCreate = computed(() => route.name === 'product-create')

async function load() {
  if (isCreate.value) {
    loading.value = false
    return
  }
  try {
    product.value = await repositories.blindBoxes.getProduct(String(route.params.productId))
    tagsText.value = product.value.tags.join(', ')
    galleryText.value = product.value.galleryUrls.join('\n')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function prepareProduct() {
  product.value.tags = tagsText.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  product.value.galleryUrls = galleryText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function save(configureAfter = false) {
  saving.value = true
  notice.value = ''
  try {
    prepareProduct()
    const saved = await repositories.blindBoxes.saveProduct(product.value, createOperationContext())
    product.value = saved
    if (configureAfter) {
      const result = await repositories.blindBoxes.listBatches({ page: 1, pageSize: 200 })
      let batch = result.items.find(
        (item) => item.productId === saved.id && item.status === 'draft',
      )
      if (!batch)
        batch = await repositories.blindBoxes.createDraft(saved.id, createOperationContext())
      await router.push({ name: 'pool-editor', params: { batchId: batch.id } })
      return
    }
    notice.value = t('phase2.success')
    if (isCreate.value)
      await router.replace({ name: 'product-detail', params: { productId: saved.id } })
  } catch (caught) {
    notice.value = caught instanceof Error ? caught.message : t('phase2.operationFailed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-stack">
    <header class="page-header blind-box-header">
      <div>
        <span class="page-eyebrow">{{ $t('phase2.eyebrow') }}</span>
        <h1>{{ $t(isCreate ? 'phase2.productCreate' : 'phase2.productEdit') }}</h1>
        <p>{{ $t('phase2.productsSubtitle') }}</p>
      </div>
      <RouterLink class="button button-secondary" :to="{ name: 'products' }">{{
        $t('phase2.workflowStep1')
      }}</RouterLink>
    </header>

    <BlindBoxWorkflowSteps :active="2" />

    <AppSkeleton v-if="loading" />
    <AppErrorState v-else-if="error" @retry="load" />
    <form v-else class="panel detail-form blind-box-form" @submit.prevent="save(false)">
      <section>
        <div class="section-heading">
          <div>
            <h2>{{ $t('phase2.basicInformation') }}</h2>
            <p>{{ $t('phase2.workflowStep2Help') }}</p>
          </div>
        </div>
        <div class="form-grid">
          <label class="field"
            ><span>{{ $t('phase2.name') }} *</span><input v-model.trim="product.name" required
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.boxType') }} *</span><input v-model.trim="product.type" required
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.slug') }} *</span><input v-model.trim="product.slug" required
          /></label>
          <label class="field switch-field"
            ><span>{{ $t('phase2.status') }}</span
            ><span class="switch-control"
              ><input v-model="product.enabled" type="checkbox" /><b>{{
                $t(product.enabled ? 'phase2.listed' : 'phase2.unlisted')
              }}</b></span
            ></label
          >
          <label class="field form-span"
            ><span>{{ $t('phase2.description') }} *</span
            ><textarea v-model.trim="product.description" rows="4" required />
          </label>
          <label class="field form-span"
            ><span>{{ $t('phase2.seoTitle') }} *</span
            ><input v-model.trim="product.seoTitle" required
          /></label>
          <label class="field form-span"
            ><span>{{ $t('phase2.tags') }}</span
            ><input v-model="tagsText"
          /></label>
        </div>
      </section>

      <section class="form-section-divider">
        <div class="section-heading">
          <div>
            <h2>{{ $t('phase2.mediaAndSchedule') }}</h2>
            <p>{{ $t('phase2.workflowStep3Help') }}</p>
          </div>
        </div>
        <div class="form-grid">
          <label class="field"
            ><span>{{ $t('phase2.cover') }}</span
            ><input v-model.trim="product.coverUrl" type="url" placeholder="https://"
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.gallery') }}</span
            ><textarea v-model="galleryText" rows="3" />
          </label>
          <label class="field"
            ><span>{{ $t('phase2.saleStart') }}</span
            ><input v-model="product.saleStartAt" type="datetime-local"
          /></label>
          <label class="field"
            ><span>{{ $t('phase2.saleEnd') }}</span
            ><input v-model="product.saleEndAt" type="datetime-local"
          /></label>
        </div>
      </section>

      <p v-if="notice" class="form-notice" aria-live="polite">{{ notice }}</p>
      <footer class="form-footer blind-box-form-actions">
        <RouterLink class="button button-ghost" :to="{ name: 'products' }">{{
          $t('common.cancel')
        }}</RouterLink>
        <button type="submit" class="button button-secondary" :disabled="saving">
          <span v-if="saving" class="spinner" />{{ $t('phase2.saveBox') }}
        </button>
        <button type="button" class="button button-primary" :disabled="saving" @click="save(true)">
          <span v-if="saving" class="spinner" />{{ $t('phase2.saveAndConfigure') }} →
        </button>
      </footer>
    </form>
  </div>
</template>
