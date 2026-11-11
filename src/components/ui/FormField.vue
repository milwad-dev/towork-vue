<script setup>
import { useId } from 'vue'

defineProps({
  label: String,
  error: String,
  hint: String,
})
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <slot :id="id" :invalid="!!error" :described-by="error ? `${id}-error` : undefined" />
    <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{{ hint }}</p>
  </div>
</template>
