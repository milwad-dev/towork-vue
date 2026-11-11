<script setup>
import { computed } from 'vue'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ListFilter, Search, X } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import PriorityFlag from './PriorityFlag.vue'
import { colorOf, PRIORITIES, SORTS, STATUSES } from '@/lib/constants'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'

/** Search, filter, sort and group controls bound to a filters object. */
const props = defineProps({
  hideCategory: Boolean,
  hideLabel: Boolean,
})
const filters = defineModel({ type: Object, required: true })
const categories = useCategoriesStore()
const labels = useLabelsStore()

const DUE = [
  { value: '', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'scheduled', label: 'Has due date' },
  { value: 'none', label: 'No due date' },
]
const GROUPS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'none', label: 'None' },
]

function set(key, value) {
  filters.value = { ...filters.value, [key]: value }
}
function toggleIn(key, value) {
  const list = filters.value[key] ?? []
  set(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
}

const activeCount = computed(
  () =>
    (filters.value.status?.length ? 1 : 0) +
    (filters.value.priority?.length ? 1 : 0) +
    (filters.value.due ? 1 : 0) +
    (!props.hideCategory && filters.value.category_id ? 1 : 0) +
    (!props.hideLabel && filters.value.label_id ? 1 : 0),
)

function clear() {
  filters.value = {
    ...filters.value,
    search: '',
    status: [],
    priority: [],
    due: '',
    ...(props.hideCategory ? {} : { category_id: '' }),
    ...(props.hideLabel ? {} : { label_id: '' }),
  }
}
defineExpose({ clear })
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <label class="relative min-w-0 flex-1 basis-48">
      <span class="sr-only">Search tasks</span>
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        :value="filters.search"
        type="search"
        class="input h-9 pl-9 text-[13px]"
        placeholder="Search tasks…"
        @input="set('search', $event.target.value)"
      />
    </label>

    <Popover width="w-72" align="end">
      <template #trigger="{ toggle, open }">
        <button type="button" class="btn btn-secondary btn-sm h-9" :aria-expanded="open" @click="toggle">
          <ListFilter class="size-4" /> Filter
          <span v-if="activeCount" class="flex size-5 items-center justify-center rounded-full bg-accent-600 text-[11px] text-white">{{ activeCount }}</span>
        </button>
      </template>
      <div class="space-y-3 p-2">
        <section>
          <p class="mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Status</p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="s in STATUSES"
              :key="s.value"
              type="button"
              class="chip h-7 border px-2"
              :class="filters.status?.includes(s.value) ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'"
              :aria-pressed="filters.status?.includes(s.value)"
              @click="toggleIn('status', s.value)"
            >
              <span class="size-1.5 rounded-full" :class="s.dot" /> {{ s.label }}
            </button>
          </div>
        </section>
        <section>
          <p class="mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Priority</p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="p in PRIORITIES"
              :key="p.value"
              type="button"
              class="chip h-7 border px-2"
              :class="filters.priority?.includes(p.value) ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'"
              :aria-pressed="filters.priority?.includes(p.value)"
              @click="toggleIn('priority', p.value)"
            >
              <PriorityFlag :priority="p.value" class="size-3" /> {{ p.label }}
            </button>
          </div>
        </section>
        <section>
          <label class="mb-1.5 block text-[11px] font-semibold tracking-wider text-zinc-400 uppercase" for="f-due">Due</label>
          <select id="f-due" class="input h-8 text-[13px]" :value="filters.due" @change="set('due', $event.target.value)">
            <option v-for="d in DUE" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </section>
        <section v-if="!hideCategory">
          <label class="mb-1.5 block text-[11px] font-semibold tracking-wider text-zinc-400 uppercase" for="f-cat">Category</label>
          <select id="f-cat" class="input h-8 text-[13px]" :value="filters.category_id" @change="set('category_id', $event.target.value)">
            <option value="">Any category</option>
            <option value="none">No category</option>
            <option v-for="c in categories.items" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
          </select>
        </section>
        <section v-if="!hideLabel && labels.items.length">
          <p class="mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Label</p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="l in labels.items"
              :key="l.id"
              type="button"
              class="chip h-7 rounded-full border px-2"
              :class="String(filters.label_id) === String(l.id) ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'"
              @click="set('label_id', String(filters.label_id) === String(l.id) ? '' : String(l.id))"
            >
              <span class="size-1.5 rounded-full" :class="colorOf(l.color).dot" /> {{ l.name }}
            </button>
          </div>
        </section>
        <button v-if="activeCount" type="button" class="btn btn-ghost btn-sm w-full" @click="clear"><X class="size-3.5" /> Clear filters</button>
      </div>
    </Popover>

    <Popover width="w-56" align="end">
      <template #trigger="{ toggle, open }">
        <button type="button" class="btn btn-secondary btn-sm h-9" :aria-expanded="open" aria-label="Sort and group" @click="toggle">
          <component :is="filters.direction === 'desc' ? ArrowDownWideNarrow : ArrowUpNarrowWide" class="size-4" />
          <span class="max-sm:hidden">{{ SORTS.find((s) => s.value === filters.sort)?.label }}</span>
        </button>
      </template>
      <p class="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Sort by</p>
      <button
        v-for="s in SORTS"
        :key="s.value"
        type="button"
        class="menu-item"
        :data-active="filters.sort === s.value"
        @click="filters = { ...filters, sort: s.value, direction: s.value === 'created_at' ? 'desc' : 'asc' }"
      >
        {{ s.label }} <Check v-if="filters.sort === s.value" class="ml-auto size-4 text-accent-500" />
      </button>
      <div class="m-1.5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          v-for="d in ['asc', 'desc']"
          :key="d"
          type="button"
          class="rounded-md py-1 text-xs font-medium"
          :class="filters.direction === d ? 'bg-white shadow-soft dark:bg-zinc-700' : 'text-zinc-500'"
          @click="set('direction', d)"
        >
          {{ d === 'asc' ? 'Ascending' : 'Descending' }}
        </button>
      </div>
      <template v-if="filters.group">
        <p class="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Group by</p>
        <button v-for="g in GROUPS" :key="g.value" type="button" class="menu-item" :data-active="filters.group === g.value" @click="set('group', g.value)">
          {{ g.label }} <Check v-if="filters.group === g.value" class="ml-auto size-4 text-accent-500" />
        </button>
      </template>
    </Popover>
  </div>
</template>
