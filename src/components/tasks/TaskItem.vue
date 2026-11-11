<script setup>
import { computed } from 'vue'
import { AlignLeft, Bell, CalendarX2, Ellipsis, ListChecks, Sun, Sunrise, Trash2 } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import TaskCheckbox from './TaskCheckbox.vue'
import DueChip from './DueChip.vue'
import LabelPill from './LabelPill.vue'
import PriorityFlag from './PriorityFlag.vue'
import { colorOf, iconOf, PRIORITIES } from '@/lib/constants'
import { quickDates } from '@/lib/dates'
import { useTaskActions } from '@/composables/useTaskActions'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  task: { type: Object, required: true },
  hideCategory: Boolean,
  hideDue: Boolean,
})

const ui = useUiStore()
const actions = useTaskActions()
const done = computed(() => props.task.status === 'done')
const dates = computed(() => quickDates())
const hasMeta = computed(
  () =>
    (!props.hideDue && props.task.due_date) ||
    props.task.subtasks_count ||
    (!props.hideCategory && props.task.category) ||
    props.task.labels?.length ||
    props.task.description ||
    props.task.remind_at,
)
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
    :class="ui.openTaskId === task.id && 'bg-accent-50/70 ring-1 ring-accent-200 dark:bg-accent-500/10 dark:ring-accent-500/30'"
    role="button"
    tabindex="0"
    :aria-label="`Open task: ${task.title}`"
    @click="ui.openTask(task.id)"
    @keydown.enter.self="ui.openTask(task.id)"
  >
    <div class="pt-0.5">
      <TaskCheckbox :checked="done" :priority="task.priority" @toggle="actions.toggle(task)" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <p
          class="min-w-0 truncate text-[14px] leading-6 transition-colors"
          :class="done ? 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600' : 'text-zinc-800 dark:text-zinc-100'"
        >
          {{ task.title }}
        </p>
        <span v-if="task.status === 'in_progress'" class="chip h-5 shrink-0 rounded-full bg-amber-500/10 px-2 text-[11px] text-amber-700 dark:text-amber-400">In progress</span>
      </div>
      <div v-if="hasMeta" class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <DueChip v-if="!hideDue" :date="task.due_date" :time="task.due_time" :done="done" />
        <span v-if="task.subtasks_count" class="inline-flex items-center gap-1 text-xs text-zinc-500" :class="task.completed_subtasks_count === task.subtasks_count && 'text-green-600 dark:text-green-400'">
          <ListChecks class="size-3.5" /> {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
        </span>
        <AlignLeft v-if="task.description" class="size-3.5 text-zinc-400" aria-label="Has description" />
        <Bell v-if="task.remind_at" class="size-3.5 text-zinc-400" aria-label="Has reminder" />
        <LabelPill v-for="l in task.labels" :key="l.id" :label="l" />
        <span v-if="!hideCategory && task.category" class="inline-flex items-center gap-1 text-xs text-zinc-500">
          <component :is="iconOf(task.category.icon)" class="size-3.5" :class="colorOf(task.category.color).text" />
          {{ task.category.name }}
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1 pt-0.5">
      <PriorityFlag v-if="task.priority > 1 && !done" :priority="task.priority" class="mt-1" />
      <Popover width="w-52" align="end">
        <template #trigger="{ toggle, open }">
          <button
            type="button"
            class="btn-icon size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
            :class="open && 'opacity-100'"
            aria-label="Task options"
            @click.stop="toggle"
          >
            <Ellipsis class="size-4" />
          </button>
        </template>
        <template #default="{ close }">
          <div @click.stop>
            <p class="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Due</p>
            <button type="button" class="menu-item" @click="close(), actions.update(task, { due_date: dates[0].value }, 'Moved to today')"><Sun class="size-4 text-green-500" /> Today</button>
            <button type="button" class="menu-item" @click="close(), actions.update(task, { due_date: dates[1].value }, 'Moved to tomorrow')"><Sunrise class="size-4 text-amber-500" /> Tomorrow</button>
            <button v-if="task.due_date" type="button" class="menu-item" @click="close(), actions.update(task, { due_date: null, due_time: null })"><CalendarX2 class="size-4 text-zinc-400" /> No date</button>
            <p class="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Priority</p>
            <div class="flex gap-1 px-1.5 pb-1.5">
              <button
                v-for="p in PRIORITIES"
                :key="p.value"
                type="button"
                class="flex h-8 flex-1 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                :class="task.priority === p.value && 'bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700'"
                :aria-label="p.label"
                :title="p.label"
                @click="close(), actions.update(task, { priority: p.value })"
              >
                <PriorityFlag :priority="p.value" class="size-4" />
              </button>
            </div>
            <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <button type="button" class="menu-item text-red-600 dark:text-red-400" @click="close(), actions.remove(task)"><Trash2 class="size-4" /> Delete</button>
          </div>
        </template>
      </Popover>
    </div>
  </div>
</template>
