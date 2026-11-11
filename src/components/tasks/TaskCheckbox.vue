<script setup>
import { ref } from 'vue'
import { Check } from '@lucide/vue'
import { priorityOf } from '@/lib/constants'

const props = defineProps({
  checked: Boolean,
  priority: { type: Number, default: 1 },
  label: { type: String, default: 'Mark as complete' },
})
const emit = defineEmits(['toggle'])
const popping = ref(false)

function onClick() {
  if (!props.checked) {
    popping.value = true
    setTimeout(() => (popping.value = false), 400)
  }
  emit('toggle')
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="checked ? 'Mark as not done' : label"
    class="group/check relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200"
    :class="[
      checked ? 'border-accent-500 bg-accent-500' : [priorityOf(priority).ring, 'hover:bg-accent-500/10'],
      popping && 'animate-pop',
    ]"
    @click.stop="onClick"
  >
    <Check
      class="size-3 transition-all duration-200"
      :class="checked ? 'scale-100 text-white opacity-100' : 'scale-75 text-zinc-400 opacity-0 group-hover/check:opacity-60'"
      stroke-width="3"
    />
    <span v-if="popping" class="pointer-events-none absolute inset-0 animate-ping rounded-full bg-accent-500/40" />
  </button>
</template>
