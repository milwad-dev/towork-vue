<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/ui/Modal.vue'
import ColorPicker from '@/components/ui/ColorPicker.vue'
import FormField from '@/components/ui/FormField.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { CATEGORY_ICONS } from '@/lib/constants'
import { errorMessage, fieldErrors } from '@/lib/api'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useUiStore } from '@/stores/ui'

/** Create / edit dialog shared by categories and labels. */
const props = defineProps({
  open: Boolean,
  kind: { type: String, default: 'category' }, // 'category' | 'label'
  item: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const router = useRouter()
const ui = useUiStore()
const store = computed(() => (props.kind === 'label' ? useLabelsStore() : useCategoriesStore()))
const noun = computed(() => (props.kind === 'label' ? 'label' : 'category'))

const form = reactive({ name: '', color: 'indigo', icon: 'folder' })
const errors = ref({})
const saving = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    errors.value = {}
    form.name = props.item?.name ?? ''
    form.color = props.item?.color ?? (props.kind === 'label' ? 'violet' : 'indigo')
    form.icon = props.item?.icon ?? 'folder'
  },
)

async function save() {
  saving.value = true
  errors.value = {}
  try {
    const payload = { name: form.name, color: form.color }
    if (props.kind === 'category') payload.icon = form.icon
    if (props.item) {
      await store.value.update(props.item.id, payload)
      ui.toast(`${noun.value[0].toUpperCase() + noun.value.slice(1)} updated`)
    } else {
      const created = await store.value.create(payload)
      ui.toast(`${noun.value[0].toUpperCase() + noun.value.slice(1)} created`)
      router.push({ name: props.kind, params: { id: created.id } })
    }
    emit('close')
  } catch (e) {
    errors.value = fieldErrors(e)
    if (!Object.keys(errors.value).length) ui.toast(errorMessage(e), { type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Modal :open="open" :title="item ? `Edit ${noun}` : `New ${noun}`" @close="emit('close')">
    <form id="collection-form" class="space-y-5" @submit.prevent="save">
      <FormField v-slot="{ id, invalid, describedBy }" label="Name" :error="errors.name">
        <input
          :id="id"
          v-model.trim="form.name"
          class="input"
          maxlength="100"
          :placeholder="kind === 'label' ? 'e.g. waiting-on' : 'e.g. Work'"
          autofocus
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
        />
      </FormField>
      <div>
        <span class="label">Color</span>
        <ColorPicker v-model="form.color" />
      </div>
      <div v-if="kind === 'category'">
        <span class="label">Icon</span>
        <div class="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Icon">
          <button
            v-for="(icon, key) in CATEGORY_ICONS"
            :key="key"
            type="button"
            role="radio"
            :aria-checked="form.icon === key"
            :aria-label="key"
            class="flex h-9 items-center justify-center rounded-lg border transition"
            :class="
              form.icon === key
                ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800'
            "
            @click="form.icon = key"
          >
            <component :is="icon" class="size-4" />
          </button>
        </div>
      </div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
      <button type="submit" form="collection-form" class="btn btn-primary" :disabled="saving || !form.name">
        <Spinner v-if="saving" /> {{ item ? 'Save changes' : `Create ${noun}` }}
      </button>
    </template>
  </Modal>
</template>
