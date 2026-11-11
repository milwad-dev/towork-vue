<script setup>
import { computed, ref, watch } from 'vue'
import { addMonths, format, isSameMonth, isToday, subMonths } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from '@lucide/vue'
import TaskItem from '@/components/tasks/TaskItem.vue'
import Popover from '@/components/ui/Popover.vue'
import { priorityOf } from '@/lib/constants'
import { monthGrid, parseDate, toISODate } from '@/lib/dates'
import { errorMessage } from '@/lib/api'
import { useTaskActions } from '@/composables/useTaskActions'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

const tasks = useTasksStore()
const ui = useUiStore()
const actions = useTaskActions()

const month = ref(new Date())
const selected = ref(toISODate(new Date()))
const error = ref('')
const dragOver = ref(null)
const MAX_CHIPS = 3

const days = computed(() => monthGrid(month.value))
const range = computed(() => ({ from: toISODate(days.value[0]), to: toISODate(days.value[days.value.length - 1]) }))

async function load() {
  error.value = ''
  try {
    await tasks.fetch({ date_from: range.value.from, date_to: range.value.to, sort: 'due_date', per_page: 200 })
  } catch (e) {
    error.value = errorMessage(e)
  }
}
watch(range, load, { immediate: true, deep: true })

const byDay = computed(() => {
  const map = {}
  for (const t of tasks.items) {
    if (!t.due_date) continue
    ;(map[t.due_date] ??= []).push(t)
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.due_time ?? '99').localeCompare(b.due_time ?? '99') || b.priority - a.priority)
  }
  return map
})

const selectedTasks = computed(() => byDay.value[selected.value] ?? [])

function go(delta) {
  month.value = delta === 0 ? new Date() : delta > 0 ? addMonths(month.value, 1) : subMonths(month.value, 1)
  if (delta === 0) selected.value = toISODate(new Date())
}

// Native drag and drop: drag a chip onto another day to reschedule it.
function onDragStart(e, task) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(task.id))
}
async function onDrop(e, day) {
  dragOver.value = null
  const id = Number(e.dataTransfer.getData('text/plain'))
  const task = tasks.items.find((t) => t.id === id)
  if (!task || task.due_date === day) return
  await actions.update(task, { due_date: day }, `Moved to ${format(parseDate(day), 'MMM d')}`)
}

function chipClass(t) {
  if (t.status === 'done') return 'bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800/60'
  return {
    4: 'bg-red-500/10 text-red-700 dark:text-red-300',
    3: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    2: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  }[t.priority] ?? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
    <header class="mb-6 flex flex-wrap items-center gap-3">
      <div class="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80"><CalendarDays class="size-5 text-accent-500" /></div>
      <h1 class="mr-auto text-2xl font-semibold tracking-tight">{{ format(month, 'MMMM yyyy') }}</h1>
      <div class="flex items-center gap-1">
        <button type="button" class="btn btn-secondary btn-sm" @click="go(0)">Today</button>
        <button type="button" class="btn-icon" aria-label="Previous month" @click="go(-1)"><ChevronLeft class="size-4" /></button>
        <button type="button" class="btn-icon" aria-label="Next month" @click="go(1)"><ChevronRight class="size-4" /></button>
      </div>
    </header>

    <div v-if="error" class="card mb-4 flex items-center justify-between gap-4 p-4 text-[13px]">
      <span class="text-red-600 dark:text-red-400">{{ error }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="load">Retry</button>
    </div>

    <div class="card overflow-hidden" :class="tasks.loading && 'opacity-70 transition-opacity'">
      <div class="grid grid-cols-7 border-b border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900">
        <div v-for="d in weekdays" :key="d" class="py-2 text-center text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7" role="grid" :aria-label="format(month, 'MMMM yyyy')">
        <div
          v-for="d in days"
          :key="d.toISOString()"
          role="gridcell"
          :aria-selected="selected === toISODate(d)"
          class="group relative min-h-16 border-r border-b border-zinc-100 p-1 transition-colors sm:min-h-28 sm:p-1.5 dark:border-zinc-800/80 [&:nth-child(7n)]:border-r-0"
          :class="[
            !isSameMonth(d, month) && 'bg-zinc-50/60 dark:bg-zinc-950/40',
            dragOver === toISODate(d) && 'bg-accent-500/10 ring-2 ring-accent-500/40 ring-inset',
            selected === toISODate(d) && 'max-sm:bg-accent-500/5',
          ]"
          @click="selected = toISODate(d)"
          @dblclick="ui.openQuickAdd({ due_date: toISODate(d) })"
          @dragover.prevent="dragOver = toISODate(d)"
          @dragleave="dragOver === toISODate(d) && (dragOver = null)"
          @drop.prevent="onDrop($event, toISODate(d))"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums"
              :class="[
                isToday(d) ? 'bg-accent-600 text-white' : isSameMonth(d, month) ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600',
              ]"
            >
              {{ format(d, 'd') }}
            </span>
            <button
              type="button"
              class="btn-icon size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden"
              :aria-label="`Add task on ${format(d, 'MMMM d')}`"
              @click.stop="ui.openQuickAdd({ due_date: toISODate(d) })"
            >
              <Plus class="size-3.5" />
            </button>
          </div>

          <!-- Mobile: dots -->
          <div class="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
            <span v-for="t in (byDay[toISODate(d)] ?? []).slice(0, 4)" :key="t.id" class="size-1.5 rounded-full" :class="t.status === 'done' ? 'bg-zinc-300 dark:bg-zinc-600' : priorityOf(t.priority).bar" />
          </div>

          <!-- Desktop: chips -->
          <div class="mt-1 hidden space-y-0.5 sm:block">
            <button
              v-for="t in (byDay[toISODate(d)] ?? []).slice(0, MAX_CHIPS)"
              :key="t.id"
              type="button"
              draggable="true"
              class="block w-full cursor-grab truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition hover:brightness-95 active:cursor-grabbing dark:hover:brightness-125"
              :class="chipClass(t)"
              :title="t.title"
              @click.stop="ui.openTask(t.id)"
              @dragstart="onDragStart($event, t)"
            >
              <span v-if="t.due_time" class="opacity-70">{{ t.due_time }}</span> {{ t.title }}
            </button>
            <Popover v-if="(byDay[toISODate(d)] ?? []).length > MAX_CHIPS" width="w-72">
              <template #trigger="{ toggle }">
                <button type="button" class="w-full rounded-md px-1.5 text-left text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click.stop="toggle">
                  +{{ byDay[toISODate(d)].length - MAX_CHIPS }} more
                </button>
              </template>
              <template #default="{ close }">
                <p class="px-2.5 pt-1.5 pb-1 text-xs font-semibold">{{ format(d, 'EEEE, MMM d') }}</p>
                <button
                  v-for="t in byDay[toISODate(d)]"
                  :key="t.id"
                  type="button"
                  draggable="true"
                  class="menu-item"
                  @click="close(), ui.openTask(t.id)"
                  @dragstart="onDragStart($event, t)"
                >
                  <span class="size-2 shrink-0 rounded-full" :class="t.status === 'done' ? 'bg-zinc-300' : priorityOf(t.priority).bar" />
                  <span class="truncate" :class="t.status === 'done' && 'text-zinc-400 line-through'">{{ t.title }}</span>
                </button>
              </template>
            </Popover>
          </div>
        </div>
      </div>
    </div>
    <p class="mt-3 hidden text-xs text-zinc-400 sm:block">Tip: drag a task to another day to reschedule it. Double-click a day to add a task.</p>

    <!-- Mobile agenda for the selected day -->
    <section class="mt-6 sm:hidden" aria-live="polite">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-[13px] font-semibold">{{ format(parseDate(selected), 'EEEE, MMM d') }}</h2>
        <button type="button" class="btn btn-ghost btn-sm" @click="ui.openQuickAdd({ due_date: selected })"><Plus class="size-4" /> Add</button>
      </div>
      <p v-if="!selectedTasks.length" class="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-[13px] text-zinc-400 dark:border-zinc-800">No tasks on this day.</p>
      <TaskItem v-for="t in selectedTasks" :key="t.id" :task="t" hide-due />
    </section>
  </div>
</template>
