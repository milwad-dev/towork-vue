<script setup>
import { computed } from 'vue'
import { Check, FolderX, Folder } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import { colorOf, iconOf } from '@/lib/constants'
import { useCategoriesStore } from '@/stores/collection'

defineProps({ compact: Boolean })
const model = defineModel({ type: Number, default: null })
const categories = useCategoriesStore()
const current = computed(() => categories.find(model.value))
</script>

<template>
  <Popover width="w-56">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="btn btn-sm max-w-44 border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="[current ? 'border-zinc-200 dark:border-zinc-700' : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700', open && 'bg-zinc-100 dark:bg-zinc-800']"
        :aria-expanded="open"
        aria-label="Category"
        @click="toggle"
      >
        <component :is="current ? iconOf(current.icon) : Folder" class="size-3.5" :class="current && colorOf(current.color).text" />
        <span v-if="current" class="truncate">{{ current.name }}</span>
        <span v-else-if="!compact">Category</span>
      </button>
    </template>
    <template #default="{ close }">
      <p v-if="!categories.items.length" class="px-2.5 py-2 text-xs text-zinc-500">No categories yet. Create one from the sidebar.</p>
      <button
        v-for="c in categories.items"
        :key="c.id"
        type="button"
        class="menu-item"
        :data-active="model === c.id"
        @click="(model = c.id), close()"
      >
        <component :is="iconOf(c.icon)" class="size-4" :class="colorOf(c.color).text" />
        <span class="truncate">{{ c.name }}</span>
        <Check v-if="model === c.id" class="ml-auto size-4 text-accent-500" />
      </button>
      <template v-if="model">
        <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <button type="button" class="menu-item" @click="(model = null), close()"><FolderX class="size-4 text-zinc-400" /> No category</button>
      </template>
    </template>
  </Popover>
</template>
