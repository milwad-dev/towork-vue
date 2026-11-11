<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { AlignLeft, Kanban, ListChecks, Plus, Search } from '@lucide/vue'
import QuickAdd from '@/components/tasks/QuickAdd.vue'
import DueChip from '@/components/tasks/DueChip.vue'
import LabelPill from '@/components/tasks/LabelPill.vue'
import PriorityFlag from '@/components/tasks/PriorityFlag.vue'
import TaskCheckbox from '@/components/tasks/TaskCheckbox.vue'
import { colorOf, iconOf, STATUSES } from '@/lib/constants'
import { errorMessage } from '@/lib/api'
import { useTaskActions } from '@/composables/useTaskActions'
import { useCategoriesStore } from '@/stores/collection'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

const tasks = useTasksStore()
const categories = useCategoriesStore()
const ui = useUiStore()
const actions = useTaskActions()

const search = ref('')
const categoryId = ref('')
const error = ref('')
const adding = ref(null)
const columns = ref({ todo: [], in_progress: [], done: [] })

const params = computed(() => ({
  sort: 'position',
  per_page: 200,
  search: search.value.trim(),
  category_id: categoryId.value,
}))

function rebuild() {
  const next = { todo: [], in_progress: [], done: [] }
  for (const t of tasks.items) (next[t.status] ?? next.todo).push(t)
  for (const key of Object.keys(next)) next[key].sort((a, b) => a.position - b.position || a.id - b.id)
  columns.value = next
}

async function load() {
  error.value = ''
  try {
    await tasks.fetch(params.value)
  } catch (e) {
    error.value = errorMessage(e)
  }
}

let timer = null
watch(params, (p, old) => {
  clearTimeout(timer)
  if (old && p.search !== old.search) timer = setTimeout(load, 250)
  else load()
})
onMounted(load)

// Keep columns in sync with store changes (drawer edits, toggles, creates).
let dragging = false
watch(
  () => tasks.items.map((t) => `${t.id}:${t.status}:${t.position}`).join('|'),
  () => {
    if (!dragging) rebuild()
  },
  { immediate: true },
)

async function persist() {
  dragging = false
  const snapshot = tasks.items.map((t) => ({ id: t.id, status: t.status, position: t.position, completed_at: t.completed_at }))
  try {
    await tasks.reorder(columns.value)
  } catch (e) {
    for (const s of snapshot) {
      const t = tasks.items.find((x) => x.id === s.id)
      if (t) Object.assign(t, s)
    }
    rebuild()
    ui.toast(errorMessage(e), { type: 'error' })
  }
}

const tones = {
  todo: 'bg-zinc-400',
  in_progress: 'bg-amber-500',
  done: 'bg-green-500',
}
</script>

<template>
  <div class="flex h-full flex-col px-4 py-6 sm:px-8 sm:py-8">
    <header class="mb-6 flex flex-wrap items-center gap-3">
      <div class="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80"><Kanban class="size-5 text-accent-500" /></div>
      <div class="mr-auto">
        <h1 class="text-2xl font-semibold tracking-tight">Board</h1>
        <p class="text-[13px] text-zinc-500 dark:text-zinc-400">Drag cards between columns to update their status.</p>
      </div>
      <label class="relative w-full sm:w-56">
        <span class="sr-only">Search</span>
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input v-model="search" type="search" class="input h-9 pl-9 text-[13px]" placeholder="Search…" />
      </label>
      <select v-model="categoryId" class="input h-9 w-full text-[13px] sm:w-44" aria-label="Filter by category">
        <option value="">All categories</option>
        <option value="none">No category</option>
        <option v-for="c in categories.items" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
      </select>
    </header>

    <div v-if="error" class="card flex items-center justify-between gap-4 p-4 text-[13px]">
      <span class="text-red-600 dark:text-red-400">{{ error }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="load">Retry</button>
    </div>

    <div v-else class="-mx-4 flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:grid lg:grid-cols-3 lg:overflow-visible">
      <section
        v-for="s in STATUSES"
        :key="s.value"
        class="flex w-[85vw] max-w-sm shrink-0 snap-center flex-col rounded-2xl bg-zinc-100/70 p-2 sm:w-80 lg:w-auto lg:max-w-none dark:bg-zinc-900/60"
        :aria-label="`${s.label} column`"
      >
        <header class="flex items-center gap-2 px-2 pt-1 pb-2.5">
          <span class="size-2 rounded-full" :class="tones[s.value]" />
          <h2 class="text-[13px] font-semibold">{{ s.label }}</h2>
          <span class="rounded-full bg-zinc-200/80 px-2 text-xs font-medium text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">{{ columns[s.value].length }}</span>
          <button type="button" class="btn-icon ml-auto size-7" :aria-label="`Add task to ${s.label}`" @click="adding = adding === s.value ? null : s.value">
            <Plus class="size-4" />
          </button>
        </header>

        <QuickAdd v-if="adding === s.value" :defaults="{ status: s.value }" expanded class="mb-2" @cancel="adding = null" />

        <div v-if="tasks.loading && !tasks.items.length" class="space-y-2">
          <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl" />
        </div>

        <VueDraggable
          v-else
          v-model="columns[s.value]"
          group="board"
          draggable="article"
          :animation="180"
          ghost-class="board-ghost"
          chosen-class="board-chosen"
          drag-class="board-drag"
          :delay="120"
          :delay-on-touch-only="true"
          class="flex min-h-32 flex-1 flex-col gap-2"
          @start="dragging = true"
          @end="persist"
        >
          <article
            v-for="t in columns[s.value]"
            :key="t.id"
            class="group cursor-grab rounded-xl border border-zinc-200/80 bg-white p-3 shadow-soft transition hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            tabindex="0"
            :aria-label="t.title"
            @click="ui.openTask(t.id)"
            @keydown.enter="ui.openTask(t.id)"
          >
            <div class="flex items-start gap-2.5">
              <TaskCheckbox class="mt-0.5" :checked="t.status === 'done'" :priority="t.priority" @toggle="actions.toggle(t)" />
              <p class="min-w-0 flex-1 text-[13px] leading-5 font-medium" :class="t.status === 'done' && 'text-zinc-400 line-through'">{{ t.title }}</p>
              <PriorityFlag v-if="t.priority > 1" :priority="t.priority" class="mt-0.5" />
            </div>
            <div v-if="t.labels?.length" class="mt-2.5 flex flex-wrap gap-1"><LabelPill v-for="l in t.labels" :key="l.id" :label="l" /></div>
            <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 empty:hidden">
              <DueChip :date="t.due_date" :time="t.due_time" :done="t.status === 'done'" />
              <span v-if="t.subtasks_count" class="inline-flex items-center gap-1 text-xs text-zinc-500"><ListChecks class="size-3.5" /> {{ t.completed_subtasks_count }}/{{ t.subtasks_count }}</span>
              <AlignLeft v-if="t.description" class="size-3.5 text-zinc-400" />
              <span v-if="t.category" class="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500">
                <component :is="iconOf(t.category.icon)" class="size-3.5" :class="colorOf(t.category.color).text" /> {{ t.category.name }}
              </span>
            </div>
          </article>
          <p v-if="!columns[s.value].length" class="pointer-events-none flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-8 text-xs text-zinc-400 dark:border-zinc-800">
            Drop tasks here
          </p>
        </VueDraggable>
      </section>
    </div>
  </div>
</template>

<style>
.board-ghost {
  opacity: 0.4;
  border-style: dashed !important;
}
.board-drag {
  transform: rotate(2deg);
  box-shadow: var(--shadow-pop) !important;
}
</style>
