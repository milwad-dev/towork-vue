<script setup>
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

const groups = [
  {
    title: 'General',
    items: [
      { keys: [mod, 'K'], label: 'Open command palette' },
      { keys: ['/'], label: 'Search tasks' },
      { keys: ['N'], label: 'New task' },
      { keys: ['['], label: 'Toggle sidebar' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close dialog or panel' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'T'], label: 'Go to Today' },
      { keys: ['G', 'U'], label: 'Go to Upcoming' },
      { keys: ['G', 'A'], label: 'Go to All tasks' },
      { keys: ['G', 'B'], label: 'Go to Board' },
      { keys: ['G', 'C'], label: 'Go to Calendar' },
      { keys: ['G', 'D'], label: 'Go to Dashboard' },
    ],
  },
  {
    title: 'Quick add syntax',
    items: [
      { keys: ['today', 'tomorrow'], label: 'Set the due date' },
      { keys: ['!urgent', '!high'], label: 'Set the priority (also !medium, !low)' },
      { keys: ['#Work'], label: 'Put in a category' },
      { keys: ['@label'], label: 'Add a label' },
    ],
  },
]
</script>

<template>
  <Modal :open="ui.shortcutsOpen" title="Keyboard shortcuts" size="max-w-lg" @close="ui.shortcutsOpen = false">
    <div class="space-y-6">
      <section v-for="g in groups" :key="g.title">
        <h3 class="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">{{ g.title }}</h3>
        <ul class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <li v-for="item in g.items" :key="item.label" class="flex items-center justify-between py-2 text-[13px]">
            <span class="text-zinc-700 dark:text-zinc-300">{{ item.label }}</span>
            <span class="flex gap-1"><kbd v-for="k in item.keys" :key="k" class="kbd">{{ k }}</kbd></span>
          </li>
        </ul>
      </section>
    </div>
  </Modal>
</template>
