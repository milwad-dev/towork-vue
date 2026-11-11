<script setup>
import { computed, ref } from 'vue'
import { Check, Plus, Tag } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import { colorOf, COLOR_KEYS } from '@/lib/constants'
import { errorMessage } from '@/lib/api'
import { useLabelsStore } from '@/stores/collection'
import { useUiStore } from '@/stores/ui'

defineProps({ compact: Boolean })
const model = defineModel({ type: Array, default: () => [] })
const labels = useLabelsStore()
const ui = useUiStore()
const query = ref('')

const selected = computed(() => labels.items.filter((l) => model.value.includes(l.id)))
const filtered = computed(() => labels.items.filter((l) => l.name.toLowerCase().includes(query.value.trim().toLowerCase())))
const canCreate = computed(
  () => query.value.trim() && !labels.items.some((l) => l.name.toLowerCase() === query.value.trim().toLowerCase()),
)

function toggle(id) {
  model.value = model.value.includes(id) ? model.value.filter((x) => x !== id) : [...model.value, id]
}

async function create() {
  if (!canCreate.value) return
  try {
    const label = await labels.create({ name: query.value.trim(), color: COLOR_KEYS[labels.items.length % COLOR_KEYS.length] })
    model.value = [...model.value, label.id]
    query.value = ''
  } catch (e) {
    ui.toast(errorMessage(e), { type: 'error' })
  }
}
</script>

<template>
  <Popover width="w-60" @close="query = ''">
    <template #trigger="{ toggle: toggleOpen, open }">
      <button
        type="button"
        class="btn btn-sm max-w-52 border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="[selected.length ? 'border-zinc-200 dark:border-zinc-700' : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700', open && 'bg-zinc-100 dark:bg-zinc-800']"
        :aria-expanded="open"
        aria-label="Labels"
        @click="toggleOpen"
      >
        <Tag class="size-3.5" />
        <span v-if="selected.length" class="truncate">{{ selected.map((l) => l.name).join(', ') }}</span>
        <span v-else-if="!compact">Labels</span>
      </button>
    </template>
    <div class="p-1">
      <input
        v-model="query"
        class="input h-8 text-[13px]"
        placeholder="Search or create…"
        aria-label="Search labels"
        @keydown.enter.prevent="filtered.length === 1 && !canCreate ? toggle(filtered[0].id) : create()"
      />
    </div>
    <div class="max-h-56 overflow-y-auto">
      <button
        v-for="l in filtered"
        :key="l.id"
        type="button"
        role="menuitemcheckbox"
        :aria-checked="model.includes(l.id)"
        class="menu-item"
        @click="toggle(l.id)"
      >
        <span class="size-2 rounded-full" :class="colorOf(l.color).dot" />
        <span class="truncate">{{ l.name }}</span>
        <Check v-if="model.includes(l.id)" class="ml-auto size-4 text-accent-500" />
      </button>
      <button v-if="canCreate" type="button" class="menu-item text-accent-600 dark:text-accent-400" @click="create">
        <Plus class="size-4" /> Create “{{ query.trim() }}”
      </button>
      <p v-if="!filtered.length && !canCreate" class="px-2.5 py-2 text-xs text-zinc-500">Type to create your first label.</p>
    </div>
  </Popover>
</template>
