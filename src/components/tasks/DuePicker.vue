<script setup>
import { computed } from 'vue'
import { CalendarDays, CalendarX2, Sun, Sunrise, CalendarArrowUp } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import { dueTone, formatDue, formatTime, quickDates } from '@/lib/dates'

const props = defineProps({
  withTime: Boolean,
  compact: Boolean,
})
const date = defineModel('date', { type: String, default: null })
const time = defineModel('time', { type: String, default: null })

const options = computed(() => quickDates())
const icons = { today: Sun, tomorrow: Sunrise, 'next-week': CalendarArrowUp }
const tone = computed(() => dueTone(date.value))
const toneClass = computed(
  () =>
    ({
      overdue: 'text-red-600 dark:text-red-400',
      today: 'text-green-600 dark:text-green-400',
      soon: 'text-amber-600 dark:text-amber-400',
    })[tone.value] ?? 'text-zinc-700 dark:text-zinc-300',
)

function pick(value, close) {
  date.value = value
  if (!value) time.value = null
  close()
}
function onDateInput(e) {
  date.value = e.target.value || null
  if (!e.target.value) time.value = null
}
function onTimeInput(e) {
  time.value = e.target.value || null
}
</script>

<template>
  <Popover width="w-64">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="btn btn-sm border border-dashed border-zinc-300 font-normal hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        :class="[date ? ['border-solid', toneClass] : 'text-zinc-500', open && 'bg-zinc-100 dark:bg-zinc-800']"
        :aria-expanded="open"
        aria-label="Due date"
        @click="toggle"
      >
        <CalendarDays class="size-3.5" />
        <span v-if="date">{{ formatDue(date) }}<template v-if="time && props.withTime"> · {{ formatTime(time) }}</template></span>
        <span v-else-if="!compact">Due date</span>
      </button>
    </template>
    <template #default="{ close }">
      <button v-for="o in options" :key="o.key" type="button" class="menu-item" @click="pick(o.value, close)">
        <component :is="icons[o.key]" class="size-4 text-zinc-400" /> {{ o.label }}
        <span class="ml-auto text-xs text-zinc-400">{{ formatDue(o.value) === o.label ? '' : formatDue(o.value) }}</span>
      </button>
      <button v-if="date" type="button" class="menu-item" @click="pick(null, close)">
        <CalendarX2 class="size-4 text-zinc-400" /> No date
      </button>
      <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
      <div class="space-y-2 p-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-zinc-500">Pick a date</span>
          <input type="date" class="input h-9" :value="date ?? ''" @change="onDateInput" />
        </label>
        <label v-if="withTime" class="block">
          <span class="mb-1 block text-xs font-medium text-zinc-500">Time (optional)</span>
          <input type="time" class="input h-9" :value="time ?? ''" :disabled="!date" @change="onTimeInput" />
        </label>
      </div>
    </template>
  </Popover>
</template>
