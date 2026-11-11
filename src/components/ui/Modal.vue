<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: Boolean,
  title: String,
  description: String,
  size: { type: String, default: 'max-w-md' },
  /** Hide the header (for custom layouts like the command palette). */
  bare: Boolean,
  position: { type: String, default: 'center' }, // 'center' | 'top'
})
const emit = defineEmits(['close'])

const panel = ref(null)
let previouslyFocused = null

function onKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
  if (e.key === 'Tab' && panel.value) {
    // simple focus trap
    const focusables = [...panel.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])')]
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      await nextTick()
      const auto = panel.value?.querySelector('[autofocus], input, textarea, button:not([data-close])')
      auto?.focus()
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px] dark:bg-black/60"
        :class="position === 'top' ? 'items-start pt-[12vh]' : 'items-center'"
        @mousedown.self="emit('close')"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="w-full animate-slide-up overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900"
          :class="size"
        >
          <template v-if="!bare">
            <div class="flex items-start justify-between gap-4 px-5 pt-5">
              <div>
                <h2 class="text-base font-semibold tracking-tight">{{ title }}</h2>
                <p v-if="description" class="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{{ description }}</p>
              </div>
              <button type="button" class="btn-icon -mt-1 -mr-1" aria-label="Close" data-close @click="emit('close')">
                <X class="size-4" />
              </button>
            </div>
            <div class="px-5 pt-4 pb-5">
              <slot />
            </div>
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <slot name="footer" />
            </div>
          </template>
          <slot v-else />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
