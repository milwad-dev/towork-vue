<script setup>
import { Check } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import PriorityFlag from './PriorityFlag.vue'
import { PRIORITIES, priorityOf } from '@/lib/constants'

defineProps({ compact: Boolean })
const model = defineModel({ type: Number, default: 1 })
</script>

<template>
  <Popover width="w-44">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="btn btn-sm border font-normal hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="[model > 1 ? 'border-zinc-200 dark:border-zinc-700' : 'border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700', open && 'bg-zinc-100 dark:bg-zinc-800']"
        :aria-expanded="open"
        aria-label="Priority"
        @click="toggle"
      >
        <PriorityFlag :priority="model" />
        <span v-if="!compact || model > 1">{{ priorityOf(model).label }}</span>
      </button>
    </template>
    <template #default="{ close }">
      <button
        v-for="p in PRIORITIES"
        :key="p.value"
        type="button"
        class="menu-item"
        :data-active="model === p.value"
        @click="(model = p.value), close()"
      >
        <PriorityFlag :priority="p.value" class="size-4" /> {{ p.label }}
        <Check v-if="model === p.value" class="ml-auto size-4 text-accent-500" />
      </button>
    </template>
  </Popover>
</template>
