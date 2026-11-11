<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * A floating panel anchored to its trigger. The panel is teleported to <body>
 * and positioned with `fixed`, so it is never clipped by scroll containers.
 */
const props = defineProps({
  align: { type: String, default: 'start' }, // 'start' | 'end'
  width: { type: String, default: 'w-56' },
  disabled: Boolean,
  triggerClass: { type: String, default: 'inline-flex' },
})
const emit = defineEmits(['open', 'close'])

const open = ref(false)
const trigger = ref(null)
const panel = ref(null)
const style = ref({})

function place() {
  const el = trigger.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const panelEl = panel.value
  const h = panelEl?.offsetHeight ?? 0
  const w = panelEl?.offsetWidth ?? 0
  const gap = 6
  let top = r.bottom + gap
  if (top + h > window.innerHeight - 8 && r.top - gap - h > 8) top = r.top - gap - h
  let left = props.align === 'end' ? r.right - w : r.left
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
  style.value = { top: `${top}px`, left: `${left}px` }
}

async function show() {
  if (props.disabled) return
  open.value = true
  await nextTick()
  place()
  // focus first focusable element in the panel
  panel.value?.querySelector('input, button, [tabindex]:not([tabindex="-1"])')?.focus()
}
function hide() {
  open.value = false
}
function toggle() {
  open.value ? hide() : show()
}

function onPointerDown(e) {
  if (!open.value) return
  if (panel.value?.contains(e.target) || trigger.value?.contains(e.target)) return
  hide()
}
function onKey(e) {
  if (open.value && e.key === 'Escape') {
    e.stopPropagation()
    hide()
    trigger.value?.querySelector('button, [tabindex]')?.focus()
  }
}

watch(open, (v) => {
  if (v) {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    emit('open')
  } else {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKey, true)
    window.removeEventListener('resize', place)
    window.removeEventListener('scroll', place, true)
    emit('close')
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('keydown', onKey, true)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})

defineExpose({ show, hide, toggle })
</script>

<template>
  <div ref="trigger" :class="triggerClass">
    <slot name="trigger" :open="open" :toggle="toggle" />
  </div>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panel"
      class="popover fixed z-[70] max-h-[min(24rem,80vh)] overflow-y-auto scrollbar-thin"
      :class="width"
      :style="style"
    >
      <slot :close="hide" />
    </div>
  </Teleport>
</template>
