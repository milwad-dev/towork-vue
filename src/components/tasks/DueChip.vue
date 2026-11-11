<script setup>
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { dueTone, formatDue, formatTime } from '@/lib/dates'

const props = defineProps({ date: String, time: String, done: Boolean })
const tone = computed(() => dueTone(props.date, props.done))
const classes = {
  overdue: 'text-red-600 dark:text-red-400',
  today: 'text-green-600 dark:text-green-400',
  soon: 'text-amber-600 dark:text-amber-400',
  later: 'text-zinc-500 dark:text-zinc-400',
  none: 'text-zinc-500',
}
</script>

<template>
  <span v-if="date" class="inline-flex items-center gap-1 text-xs font-medium" :class="classes[tone]">
    <CalendarDays class="size-3.5" />
    {{ formatDue(date) }}<template v-if="time"> · {{ formatTime(time) }}</template>
    <span v-if="tone === 'overdue'" class="sr-only">(overdue)</span>
  </span>
</template>
