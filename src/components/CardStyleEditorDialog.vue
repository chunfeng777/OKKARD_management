<script setup lang="ts">
import type { CardStyle } from '@/domain/inventory'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  style: CardStyle
  busy?: boolean
}>()
const emit = defineEmits<{
  close: []
  save: [style: CardStyle]
}>()

const { t } = useI18n()
const copyStyle = (value: CardStyle): CardStyle => JSON.parse(JSON.stringify(value)) as CardStyle
const draft = ref<CardStyle>(copyStyle(props.style))
const uploadState = ref<'idle' | 'reading' | 'done' | 'error'>('idle')
const uploadError = ref('')
const uploadProgress = ref(0)
const submitted = ref(false)
const fileInput = ref<HTMLInputElement>()
const gradeHelp = [
  { grade: 'SS', key: 'phase2.gradeSsHelp' },
  { grade: 'S', key: 'phase2.gradeSHelp' },
  { grade: 'A', key: 'phase2.gradeAHelp' },
  { grade: 'B', key: 'phase2.gradeBHelp' },
  { grade: 'C', key: 'phase2.gradeCHelp' },
] as const
const isNew = computed(() => !draft.value.id)
const valid = computed(
  () =>
    draft.value.name.trim().length > 0 &&
    draft.value.category.trim().length > 0 &&
    draft.value.rarity.trim().length > 0 &&
    Boolean(draft.value.valueGrade) &&
    Number.isFinite(draft.value.marketValueUsd) &&
    draft.value.marketValueUsd >= 0 &&
    Number.isFinite(draft.value.coinValue) &&
    draft.value.coinValue >= 0,
)

watch(
  () => [props.open, props.style] as const,
  ([open]) => {
    if (!open) return
    draft.value = copyStyle(props.style)
    uploadState.value = 'idle'
    uploadError.value = ''
    uploadProgress.value = 0
    submitted.value = false
  },
  { deep: true },
)

function openPicker() {
  fileInput.value?.click()
}

function readImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    uploadState.value = 'error'
    uploadError.value = t('phase2.invalidImageType')
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    uploadState.value = 'error'
    uploadError.value = t('phase2.imageTooLarge')
    input.value = ''
    return
  }
  const reader = new FileReader()
  uploadState.value = 'reading'
  uploadProgress.value = 0
  reader.onprogress = (progress) => {
    if (progress.lengthComputable)
      uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
  }
  reader.onload = () => {
    draft.value.referenceImageUrl = String(reader.result ?? '')
    uploadProgress.value = 100
    uploadState.value = 'done'
  }
  reader.onerror = () => {
    uploadState.value = 'error'
    uploadError.value = t('phase2.operationFailed')
  }
  reader.readAsDataURL(file)
}

function submit() {
  submitted.value = true
  if (!valid.value || props.busy) return
  emit('save', copyStyle(draft.value))
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" @click.self="$emit('close')">
      <section
        class="dialog card-style-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-style-dialog-title"
      >
        <header>
          <div>
            <small>{{ $t('phase2.cardStylesTitle') }}</small>
            <h2 id="card-style-dialog-title">
              {{ $t(isNew ? 'phase2.addCardStyle' : 'phase2.editCardStyle') }}
            </h2>
          </div>
          <button class="icon-button" :aria-label="$t('common.close')" @click="$emit('close')">
            ×
          </button>
        </header>

        <form class="card-style-form" @submit.prevent="submit">
          <div class="card-style-fields">
            <label class="field field-span-2">
              <span>{{ $t('phase2.name') }} *</span>
              <input v-model.trim="draft.name" required />
            </label>
            <label class="field">
              <span>{{ $t('phase2.category') }} *</span>
              <input v-model.trim="draft.category" required />
            </label>
            <label class="field">
              <span>{{ $t('phase2.rarity') }} *</span>
              <input v-model.trim="draft.rarity" required />
            </label>
            <label class="field">
              <span>{{ $t('phase2.valueGradeLabel') }} *</span>
              <select v-model="draft.valueGrade" required>
                <option value="SS">SS</option>
                <option value="S">S</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>
            <label class="field">
              <span>{{ $t('phase2.set') }}</span>
              <input v-model.trim="draft.setName" />
            </label>
            <label class="field">
              <span>{{ $t('phase2.marketValue') }} (USD) *</span>
              <input
                v-model.number="draft.marketValueUsd"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </label>
            <label class="field">
              <span>{{ $t('phase2.coinValue') }} *</span>
              <input v-model.number="draft.coinValue" type="number" min="0" step="1" required />
            </label>
            <label class="field field-span-2">
              <span>IP Tag</span>
              <input v-model.trim="draft.ipTag" />
            </label>
            <div class="grade-reference field-span-2">
              <span>{{ $t('phase2.gradeReference') }}</span>
              <div v-for="item in gradeHelp" :key="item.grade" class="grade-help">
                <b>{{ item.grade }}</b
                ><small>{{ $t(item.key) }}</small>
              </div>
            </div>
          </div>

          <aside class="card-image-editor">
            <span>{{ $t('phase2.cardImage') }}</span>
            <div class="card-image-preview">
              <img
                v-if="draft.referenceImageUrl"
                :src="draft.referenceImageUrl"
                :alt="draft.name || $t('phase2.imagePreview')"
              />
              <span v-else>{{ $t('phase2.imagePreview') }}</span>
            </div>
            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="readImage"
            />
            <button type="button" class="button button-secondary" @click="openPicker">
              + {{ $t('phase2.uploadImage') }}
            </button>
            <label class="field">
              <span>{{ $t('phase2.imageUrl') }}</span>
              <input v-model.trim="draft.referenceImageUrl" type="url" placeholder="https://" />
            </label>
            <small>{{ $t('phase2.uploadRequirements') }}</small>
            <div v-if="uploadState === 'reading'" class="upload-status" aria-live="polite">
              <span>{{ $t('phase2.uploadReading') }} {{ uploadProgress }}%</span>
              <progress :value="uploadProgress" max="100" />
            </div>
            <p v-else-if="uploadState === 'done'" class="text-success">
              {{ $t('phase2.uploadComplete') }}
            </p>
            <p v-else-if="uploadError" class="text-danger">{{ uploadError }}</p>
          </aside>

          <p v-if="submitted && !valid" class="form-error field-span-all">
            {{ $t('phase2.styleRequired') }}
          </p>
          <footer class="field-span-all">
            <button
              type="button"
              class="button button-secondary"
              :disabled="busy"
              @click="$emit('close')"
            >
              {{ $t('common.cancel') }}
            </button>
            <button type="submit" class="button button-primary" :disabled="busy">
              <span v-if="busy" class="spinner" />{{
                $t(isNew ? 'phase2.saveCard' : 'phase2.saveChanges')
              }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
