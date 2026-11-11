<script setup>
import { Check } from '@lucide/vue'
import { COLOR_KEYS, colorOf } from '@/lib/constants'

const model = defineModel({ type: String, default: 'indigo' })
</script>

<template>
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
    <button
      v-for="key in COLOR_KEYS"
      :key="key"
      type="button"
      role="radio"
      :aria-checked="model === key"
      :aria-label="key"
      :title="key"
      class="flex size-7 items-center justify-center rounded-full ring-offset-2 transition hover:scale-110 dark:ring-offset-zinc-900"
      :class="[colorOf(key).dot, model === key ? 'ring-2 ring-zinc-900/70 dark:ring-white/80' : '']"
      @click="model = key"
    >
      <Check v-if="model === key" class="size-3.5 text-white" stroke-width="3" />
    </button>
  </div>
</template>
