<script setup>
import { nextTick, ref, watch } from 'vue'

/** Six separate digit boxes that behave like one input (paste, arrows, backspace). */
const props = defineProps({
  length: { type: Number, default: 6 },
  invalid: Boolean,
  disabled: Boolean,
})
const model = defineModel({ type: String, default: '' })
const emit = defineEmits(['complete'])

const boxes = ref([])
const digits = ref(Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))

watch(model, (v) => {
  if (v !== digits.value.join('')) digits.value = Array.from({ length: props.length }, (_, i) => v[i] ?? '')
})

function sync() {
  // Read the joined value locally: a defineModel ref still returns the old prop
  // value until the parent re-renders.
  const value = digits.value.join('')
  model.value = value
  if (value.length === props.length && /^\d+$/.test(value)) emit('complete', value)
}

function focus(i) {
  nextTick(() => boxes.value[Math.max(0, Math.min(i, props.length - 1))]?.focus())
}

function onInput(i, e) {
  const value = e.target.value.replace(/\D/g, '')
  if (value.length > 1) {
    // typed fast or autofilled into one box
    fill(i, value)
    return
  }
  digits.value[i] = value
  e.target.value = value
  sync()
  if (value) focus(i + 1)
}

function fill(start, value) {
  const chars = value.replace(/\D/g, '').split('')
  for (let k = 0; k < chars.length && start + k < props.length; k++) digits.value[start + k] = chars[k]
  sync()
  focus(Math.min(start + chars.length, props.length - 1))
}

function onPaste(i, e) {
  e.preventDefault()
  fill(i, e.clipboardData.getData('text'))
}

function onKeydown(i, e) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    digits.value[i - 1] = ''
    sync()
    focus(i - 1)
    e.preventDefault()
  } else if (e.key === 'ArrowLeft') {
    focus(i - 1)
  } else if (e.key === 'ArrowRight') {
    focus(i + 1)
  }
}

defineExpose({ focus: () => focus(0) })
</script>

<template>
  <div class="flex justify-between gap-2" role="group" aria-label="Verification code">
    <input
      v-for="(d, i) in digits"
      :key="i"
      :ref="(el) => (boxes[i] = el)"
      :value="d"
      class="input h-12 w-full max-w-12 px-0 text-center text-lg font-semibold tabular-nums"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      :aria-label="`Digit ${i + 1}`"
      :aria-invalid="invalid"
      :disabled="disabled"
      @input="onInput(i, $event)"
      @paste="onPaste(i, $event)"
      @keydown="onKeydown(i, $event)"
      @focus="$event.target.select()"
    />
  </div>
</template>
