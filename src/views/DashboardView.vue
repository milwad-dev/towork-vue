<script setup>
import { computed, onMounted, ref } from 'vue'
import { format } from 'date-fns'
import { AlarmClock, CircleCheckBig, CircleDashed, Flame, LayoutDashboard, Sun, TrendingUp } from '@lucide/vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { colorOf, PRIORITIES } from '@/lib/constants'
import { parseDate } from '@/lib/dates'
import { api, errorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const stats = ref(null)
const loading = ref(true)
const error = ref('')
const hover = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/stats')
    stats.value = data.data
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const cards = computed(() => {
  const t = stats.value?.totals ?? {}
  return [
    { label: 'Open tasks', value: (t.todo ?? 0) + (t.in_progress ?? 0), sub: `${t.in_progress ?? 0} in progress`, icon: CircleDashed, tone: 'text-accent-600 bg-accent-500/10 dark:text-accent-400', to: '/tasks' },
    { label: 'Due today', value: t.due_today ?? 0, sub: `${t.upcoming ?? 0} upcoming`, icon: Sun, tone: 'text-green-600 bg-green-500/10 dark:text-green-400', to: '/today' },
    { label: 'Overdue', value: t.overdue ?? 0, sub: t.overdue ? 'Needs attention' : 'Nothing late', icon: AlarmClock, tone: 'text-red-600 bg-red-500/10 dark:text-red-400', to: '/today' },
    { label: 'Completed', value: t.done ?? 0, sub: `of ${t.all ?? 0} total`, icon: CircleCheckBig, tone: 'text-violet-600 bg-violet-500/10 dark:text-violet-400', to: '/tasks' },
  ]
})

// Activity chart geometry
const W = 640
const H = 200
const PAD = { top: 12, right: 8, bottom: 28, left: 28 }
const activity = computed(() => stats.value?.activity ?? [])
const maxY = computed(() => Math.max(4, ...activity.value.flatMap((d) => [d.created, d.completed])))
const niceMax = computed(() => Math.ceil(maxY.value / 4) * 4)
const slot = computed(() => (W - PAD.left - PAD.right) / Math.max(1, activity.value.length))
const barW = computed(() => Math.max(4, Math.min(14, slot.value / 3)))
function y(v) {
  return PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / niceMax.value)
}
const ticks = computed(() => [0, 1, 2, 3, 4].map((i) => (niceMax.value / 4) * i))
const chartTotals = computed(() => ({
  created: activity.value.reduce((s, d) => s + d.created, 0),
  completed: activity.value.reduce((s, d) => s + d.completed, 0),
}))

const priorityTotal = computed(() => Object.values(stats.value?.by_priority ?? {}).reduce((s, n) => s + n, 0))

// Completion ring
const R = 42
const C = 2 * Math.PI * R
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
    <header class="mb-8 flex items-start gap-3">
      <div class="mt-1 flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80"><LayoutDashboard class="size-5 text-accent-500" /></div>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ greeting }}, {{ auth.user?.name?.split(' ')[0] }}</h1>
        <p class="text-[13px] text-zinc-500 dark:text-zinc-400">Here's how your work is going.</p>
      </div>
    </header>

    <div v-if="error" class="card flex items-center justify-between gap-4 p-4 text-[13px]">
      <span class="text-red-600 dark:text-red-400">{{ error }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="load">Retry</button>
    </div>

    <template v-else-if="loading">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="i in 4" :key="i" class="skeleton h-28 rounded-xl" />
      </div>
      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <div class="skeleton h-72 rounded-xl lg:col-span-2" />
        <div class="skeleton h-72 rounded-xl" />
      </div>
    </template>

    <EmptyState
      v-else-if="!stats.totals.all"
      :icon="TrendingUp"
      title="Your dashboard is waiting"
      description="Create a few tasks and complete them. Your progress, streaks and trends will appear here."
    >
      <RouterLink to="/today" class="btn btn-primary">Add your first task</RouterLink>
    </EmptyState>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <RouterLink v-for="c in cards" :key="c.label" :to="c.to" class="card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <div class="flex items-center justify-between">
            <span class="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{{ c.label }}</span>
            <span class="flex size-8 items-center justify-center rounded-lg" :class="c.tone"><component :is="c.icon" class="size-4" /></span>
          </div>
          <p class="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{{ c.value }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ c.sub }}</p>
        </RouterLink>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <!-- Activity -->
        <section class="card p-5 lg:col-span-2" aria-labelledby="activity-title">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="activity-title" class="text-[15px] font-semibold">Activity</h2>
              <p class="text-xs text-zinc-500">Last 14 days</p>
            </div>
            <div class="flex gap-4 text-xs">
              <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" /> Created <b class="font-semibold tabular-nums">{{ chartTotals.created }}</b></span>
              <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-accent-500" /> Completed <b class="font-semibold tabular-nums">{{ chartTotals.completed }}</b></span>
            </div>
          </div>
          <div class="relative mt-4">
            <svg :viewBox="`0 0 ${W} ${H}`" class="h-auto w-full" role="img" aria-label="Bar chart of tasks created and completed per day over the last 14 days">
              <g v-for="t in ticks" :key="t">
                <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" class="stroke-zinc-100 dark:stroke-zinc-800" stroke-dasharray="3 3" />
                <text :x="PAD.left - 8" :y="y(t) + 3" text-anchor="end" class="fill-zinc-400 text-[10px]">{{ t }}</text>
              </g>
              <g v-for="(d, i) in activity" :key="d.date" @mouseenter="hover = i" @mouseleave="hover = null">
                <rect :x="PAD.left + i * slot" :y="PAD.top" :width="slot" :height="H - PAD.top - PAD.bottom" :class="hover === i ? 'fill-zinc-100/80 dark:fill-zinc-800/60' : 'fill-transparent'" rx="6" />
                <rect
                  :x="PAD.left + i * slot + slot / 2 - barW - 1"
                  :y="y(d.created)"
                  :width="barW"
                  :height="Math.max(0, H - PAD.bottom - y(d.created))"
                  rx="3"
                  class="fill-zinc-300 transition-all duration-500 dark:fill-zinc-600"
                />
                <rect
                  :x="PAD.left + i * slot + slot / 2 + 1"
                  :y="y(d.completed)"
                  :width="barW"
                  :height="Math.max(0, H - PAD.bottom - y(d.completed))"
                  rx="3"
                  class="fill-accent-500 transition-all duration-500"
                />
                <text v-if="i % 2 === 0 || i === activity.length - 1" :x="PAD.left + i * slot + slot / 2" :y="H - 8" text-anchor="middle" class="fill-zinc-400 text-[10px]">
                  {{ format(parseDate(d.date), 'MMM d') }}
                </text>
              </g>
            </svg>
            <div
              v-if="hover !== null && activity[hover]"
              class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-pop dark:bg-zinc-700"
              :style="{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }"
            >
              <p class="font-medium">{{ format(parseDate(activity[hover].date), 'EEE, MMM d') }}</p>
              <p class="text-zinc-300">{{ activity[hover].created }} created · {{ activity[hover].completed }} completed</p>
            </div>
          </div>
        </section>

        <!-- Completion & streak -->
        <section class="card flex flex-col p-5" aria-labelledby="progress-title">
          <h2 id="progress-title" class="text-[15px] font-semibold">Progress</h2>
          <div class="flex flex-1 flex-col items-center justify-center py-4">
            <div class="relative">
              <svg viewBox="0 0 100 100" class="size-36 -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#6366f1" />
                    <stop offset="1" stop-color="#a855f7" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" :r="R" fill="none" stroke-width="9" class="stroke-zinc-100 dark:stroke-zinc-800" />
                <circle
                  cx="50"
                  cy="50"
                  :r="R"
                  fill="none"
                  stroke="url(#ring-g)"
                  stroke-width="9"
                  stroke-linecap="round"
                  :stroke-dasharray="C"
                  :stroke-dashoffset="C * (1 - stats.completion_rate / 100)"
                  class="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-semibold tracking-tight tabular-nums">{{ stats.completion_rate }}%</span>
                <span class="text-xs text-zinc-500">completed</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-3">
            <span class="flex size-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500"><Flame class="size-5" /></span>
            <div>
              <p class="text-[13px] font-semibold">{{ stats.streak }}-day streak</p>
              <p class="text-xs text-zinc-500">{{ stats.streak ? 'Keep it going. Finish a task today.' : 'Complete a task to start a streak.' }}</p>
            </div>
          </div>
        </section>

        <!-- Categories -->
        <section class="card p-5 lg:col-span-2" aria-labelledby="cat-title">
          <h2 id="cat-title" class="text-[15px] font-semibold">Categories</h2>
          <p v-if="!stats.by_category.length" class="mt-4 text-[13px] text-zinc-500">No categories yet. Create one from the sidebar to group related tasks.</p>
          <ul class="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <li v-for="c in stats.by_category" :key="c.id">
              <RouterLink :to="`/categories/${c.id}`" class="group block">
                <div class="mb-1.5 flex items-center justify-between text-[13px]">
                  <span class="flex items-center gap-2 font-medium group-hover:underline"><span class="size-2 rounded-full" :class="colorOf(c.color).dot" /> {{ c.name }}</span>
                  <span class="text-xs text-zinc-500 tabular-nums">{{ c.done }}/{{ c.total }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div class="h-full rounded-full transition-all duration-700" :class="colorOf(c.color).bar" :style="{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }" />
                </div>
              </RouterLink>
            </li>
          </ul>
        </section>

        <!-- Priority -->
        <section class="card p-5" aria-labelledby="prio-title">
          <h2 id="prio-title" class="text-[15px] font-semibold">Open by priority</h2>
          <div class="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              v-for="p in PRIORITIES"
              :key="p.value"
              class="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
              :class="p.bar"
              :style="{ width: `${priorityTotal ? ((stats.by_priority[p.value] ?? 0) / priorityTotal) * 100 : 0}%` }"
            />
          </div>
          <ul class="mt-4 space-y-2.5">
            <li v-for="p in PRIORITIES" :key="p.value" class="flex items-center justify-between text-[13px]">
              <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm" :class="p.bar" /> {{ p.label }}</span>
              <span class="font-medium tabular-nums">{{ stats.by_priority[p.value] ?? 0 }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
