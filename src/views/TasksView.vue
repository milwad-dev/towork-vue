<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import {
  CalendarRange,
  ChevronRight,
  CircleCheckBig,
  Inbox,
  Pencil,
  SearchX,
  Star,
  Tag,
} from '@lucide/vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CollectionDialog from '@/components/app/CollectionDialog.vue'
import QuickAdd from '@/components/tasks/QuickAdd.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskItem from '@/components/tasks/TaskItem.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { colorOf, iconOf, PRIORITIES, STATUSES } from '@/lib/constants'
import { dayHeading, quickDates, todayISO } from '@/lib/dates'
import { errorMessage } from '@/lib/api'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useTasksStore } from '@/stores/tasks'

const props = defineProps({
  mode: { type: String, required: true }, // today | upcoming | all | category | label
  id: Number,
})

const tasks = useTasksStore()
const categories = useCategoriesStore()
const labels = useLabelsStore()
const router = useRouter()

const today = todayISO()
const error = ref('')
const editOpen = ref(false)
const collapsed = ref({ done: true })
const filterable = computed(() => ['all', 'category', 'label'].includes(props.mode))

const filters = ref({
  search: '',
  status: [],
  priority: [],
  due: '',
  category_id: '',
  label_id: '',
  sort: 'created_at',
  direction: 'desc',
  group: 'status',
})

const category = computed(() => (props.mode === 'category' ? categories.find(props.id) : null))
const label = computed(() => (props.mode === 'label' ? labels.find(props.id) : null))

watch(
  () => [categories.loaded, labels.loaded, category.value, label.value],
  () => {
    if (props.mode === 'category' && categories.loaded && !category.value) router.replace({ name: 'not-found', params: { pathMatch: ['categories', String(props.id)] } })
    if (props.mode === 'label' && labels.loaded && !label.value) router.replace({ name: 'not-found', params: { pathMatch: ['labels', String(props.id)] } })
  },
  { immediate: true },
)

const params = computed(() => {
  const open = ['todo', 'in_progress']
  switch (props.mode) {
    case 'today':
      return { date_to: today, status: open, sort: 'due_date', per_page: 200 }
    case 'upcoming':
      return { due: 'upcoming', status: open, sort: 'due_date', per_page: 200 }
    default: {
      const f = filters.value
      const p = {
        search: f.search.trim(),
        status: f.status,
        priority: f.priority,
        due: f.due,
        category_id: f.category_id,
        label_id: f.label_id,
        sort: f.sort,
        direction: f.direction,
        per_page: 50,
      }
      if (props.mode === 'category') p.category_id = props.id
      if (props.mode === 'label') p.label_id = props.id
      return p
    }
  }
})

let timer = null
async function load() {
  error.value = ''
  try {
    await tasks.fetch(params.value)
  } catch (e) {
    error.value = errorMessage(e)
  }
}
watch(
  params,
  (p, old) => {
    clearTimeout(timer)
    // debounce typing in the search box
    if (old && p.search !== old.search) timer = setTimeout(load, 250)
    else load()
  },
  { immediate: true, deep: true },
)

const header = computed(() => {
  switch (props.mode) {
    case 'today':
      return { title: 'Today', subtitle: format(new Date(), 'EEEE, MMMM d'), icon: Star, iconClass: 'text-amber-500' }
    case 'upcoming':
      return { title: 'Upcoming', subtitle: 'Everything scheduled after today', icon: CalendarRange, iconClass: 'text-accent-500' }
    case 'category':
      return { title: category.value?.name ?? '…', icon: iconOf(category.value?.icon), iconClass: colorOf(category.value?.color).text }
    case 'label':
      return { title: label.value?.name ?? '…', icon: Tag, iconClass: colorOf(label.value?.color).text }
    default:
      return { title: 'All tasks', subtitle: null, icon: Inbox, iconClass: 'text-accent-500' }
  }
})

const quickDefaults = computed(() => {
  if (props.mode === 'today') return { due_date: today }
  if (props.mode === 'upcoming') return { due_date: quickDates()[1].value }
  if (props.mode === 'category') return { category_id: props.id }
  if (props.mode === 'label') return { label_ids: [props.id] }
  return {}
})

/** Group the loaded tasks for display. */
const groups = computed(() => {
  const items = tasks.items
  if (props.mode === 'today') {
    const overdue = items.filter((t) => t.due_date && t.due_date < today)
    const rest = items.filter((t) => !t.due_date || t.due_date >= today)
    return [
      overdue.length && { key: 'overdue', title: 'Overdue', tone: 'text-red-600 dark:text-red-400', items: overdue },
      { key: 'today', title: 'Today', items: rest, hideDue: true },
    ].filter(Boolean)
  }
  if (props.mode === 'upcoming') {
    const byDate = new Map()
    for (const t of items) {
      if (!byDate.has(t.due_date)) byDate.set(t.due_date, [])
      byDate.get(t.due_date).push(t)
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a ?? '9999').localeCompare(b ?? '9999'))
      .map(([date, list]) => ({ key: date ?? 'none', title: dayHeading(date), items: list, hideDue: true }))
  }
  const group = filters.value.group
  if (group === 'status') {
    return STATUSES.map((s) => ({ key: s.value, title: s.label, dot: s.dot, items: items.filter((t) => t.status === s.value), collapsible: s.value === 'done' })).filter((g) => g.items.length)
  }
  if (group === 'priority') {
    return PRIORITIES.map((p) => ({ key: `p${p.value}`, title: p.label, dot: p.bar, items: items.filter((t) => t.priority === p.value) })).filter((g) => g.items.length)
  }
  return [{ key: 'all', title: null, items }]
})

const total = computed(() => tasks.meta?.total ?? tasks.items.length)
const openCount = computed(() => tasks.items.filter((t) => t.status !== 'done').length)
const hasFilters = computed(() => {
  const f = filters.value
  return !!(f.search || f.status.length || f.priority.length || f.due || f.category_id || f.label_id)
})
const filtersRef = ref(null)
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
    <!-- Header -->
    <header class="mb-6">
      <div class="flex items-start gap-3">
        <div class="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <component :is="header.icon" class="size-5" :class="header.iconClass" />
        </div>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-2xl font-semibold tracking-tight">{{ header.title }}</h1>
          <p class="text-[13px] text-zinc-500 dark:text-zinc-400">
            <template v-if="header.subtitle">{{ header.subtitle }} · </template>
            <template v-if="!tasks.loading || tasks.items.length">
              {{ mode === 'today' || mode === 'upcoming' ? `${openCount} open` : `${total} ${total === 1 ? 'task' : 'tasks'}` }}
            </template>
          </p>
        </div>
        <button v-if="mode === 'category' || mode === 'label'" type="button" class="btn btn-ghost btn-sm" @click="editOpen = true">
          <Pencil class="size-3.5" /> Edit
        </button>
      </div>

      <div v-if="category" class="mt-4 flex items-center gap-3">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="colorOf(category.color).bar"
            :style="{ width: `${category.tasks_count ? Math.round(((category.tasks_count - category.open_tasks_count) / category.tasks_count) * 100) : 0}%` }"
          />
        </div>
        <span class="text-xs text-zinc-500 tabular-nums">{{ category.tasks_count - category.open_tasks_count }}/{{ category.tasks_count }} done</span>
      </div>

      <TaskFilters v-if="filterable" ref="filtersRef" v-model="filters" class="mt-5" :hide-category="mode === 'category'" :hide-label="mode === 'label'" />
    </header>

    <QuickAdd :key="mode + (id ?? '')" :defaults="quickDefaults" :placeholder="mode === 'today' ? 'Add a task for today' : 'Add a task'" class="mb-4" />

    <!-- Error -->
    <div v-if="error" class="card flex items-center justify-between gap-4 p-4 text-[13px]">
      <span class="text-red-600 dark:text-red-400">{{ error }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="load">Retry</button>
    </div>

    <!-- Loading -->
    <div v-else-if="tasks.loading && !tasks.items.length" class="space-y-1" aria-busy="true" aria-label="Loading tasks">
      <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-3 py-3">
        <span class="skeleton size-[18px] rounded-full" />
        <span class="skeleton h-3.5" :style="{ width: `${40 + ((i * 37) % 45)}%` }" />
      </div>
    </div>

    <!-- Empty -->
    <template v-else-if="!tasks.items.length">
      <EmptyState v-if="filterable && hasFilters" :icon="SearchX" title="No tasks match your filters" description="Try a different search or clear the filters.">
        <button type="button" class="btn btn-secondary" @click="filtersRef?.clear()">Clear filters</button>
      </EmptyState>
      <EmptyState v-else-if="mode === 'today'" :icon="CircleCheckBig" tone="green" title="All clear for today" description="Enjoy the calm, or plan something new above." />
      <EmptyState v-else-if="mode === 'upcoming'" :icon="CalendarRange" title="Nothing scheduled" description="Tasks with a future due date will show up here, grouped by day." />
      <EmptyState v-else :icon="Inbox" title="No tasks yet" description="Capture your first task above. Press N anywhere to add one quickly." />
    </template>

    <!-- Groups -->
    <div v-else class="space-y-6" :class="tasks.loading && 'opacity-60 transition-opacity'">
      <section v-for="g in groups" :key="g.key" :aria-label="g.title ?? 'Tasks'">
        <button
          v-if="g.title"
          type="button"
          class="mb-1 flex w-full items-center gap-2 border-b border-zinc-100 px-1 pb-2 text-left text-[13px] font-semibold dark:border-zinc-800/80"
          :class="g.tone ?? 'text-zinc-800 dark:text-zinc-200'"
          :aria-expanded="!collapsed[g.key]"
          :disabled="!g.collapsible"
          @click="collapsed[g.key] = !collapsed[g.key]"
        >
          <ChevronRight v-if="g.collapsible" class="size-4 text-zinc-400 transition-transform" :class="!collapsed[g.key] && 'rotate-90'" />
          <span v-if="g.dot" class="size-2 rounded-full" :class="g.dot" />
          {{ g.title }}
          <span class="font-normal text-zinc-400">{{ g.items.length }}</span>
        </button>
        <TransitionGroup v-if="!(g.collapsible && collapsed[g.key])" tag="div" name="list" class="relative">
          <TaskItem v-for="t in g.items" :key="t.id" :task="t" :hide-category="mode === 'category'" :hide-due="g.hideDue" />
        </TransitionGroup>
      </section>

      <div v-if="tasks.hasMore" class="flex justify-center pt-2">
        <button type="button" class="btn btn-secondary" :disabled="tasks.loadingMore" @click="tasks.loadMore()">
          <Spinner v-if="tasks.loadingMore" /> Load more
        </button>
      </div>
    </div>

    <CollectionDialog :open="editOpen" :kind="mode === 'label' ? 'label' : 'category'" :item="category ?? label" @close="editOpen = false" />
  </div>
</template>
