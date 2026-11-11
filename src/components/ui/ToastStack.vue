<script setup>
import { CircleAlert, CircleCheck, Info, X } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const tones = { success: 'text-green-400', error: 'text-red-400', info: 'text-sky-400' }

function runAction(toast) {
  toast.action.handler()
  ui.dismissToast(toast.id)
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6"
    aria-live="polite"
    role="status"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-zinc-900 py-2.5 pr-2 pl-3.5 text-[13px] text-zinc-100 shadow-pop ring-1 ring-white/10 dark:bg-zinc-800"
      >
        <component :is="icons[toast.type]" class="size-4 shrink-0" :class="tones[toast.type]" />
        <span class="min-w-0 flex-1">{{ toast.message }}</span>
        <button
          v-if="toast.action"
          type="button"
          class="rounded-md px-2 py-1 font-semibold text-accent-300 hover:bg-white/10"
          @click="runAction(toast)"
        >
          {{ toast.action.label }}
        </button>
        <button
          type="button"
          class="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          aria-label="Dismiss"
          @click="ui.dismissToast(toast.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
