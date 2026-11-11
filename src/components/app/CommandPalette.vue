<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  CalendarDays,
  CalendarRange,
  CircleCheck,
  Circle,
  CornerDownLeft,
  Inbox,
  Kanban,
  Keyboard,
  LayoutDashboard,
  Monitor,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
} from '@lucide/vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { colorOf, iconOf } from '@/lib/constants'
import { formatDue } from '@/lib/dates'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const router = useRouter()
const tasks = useTasksStore()
const categories = useCategoriesStore()
const labels = useLabelsStore()

const query = ref('')
const results = ref([])
const searching = ref(false)
const active = ref(0)
const listEl = ref(null)
let timer = null
let seq = 0

const commands = computed(() => [
  { id: 'new', group: 'Actions', label: 'Create task', icon: Plus, hint: 'N', run: () => ui.openQuickAdd() },
  { id: 'theme', group: 'Actions', label: `Switch theme (now: ${ui.theme})`, icon: Monitor, run: () => ui.cycleTheme(), keepOpen: true },
  { id: 'shortcuts', group: 'Actions', label: 'Keyboard shortcuts', icon: Keyboard, hint: '?', run: () => (ui.shortcutsOpen = true) },
  { id: 'today', group: 'Go to', label: 'Today', icon: Star, run: () => router.push('/today') },
  { id: 'upcoming', group: 'Go to', label: 'Upcoming', icon: CalendarRange, run: () => router.push('/upcoming') },
  { id: 'all', group: 'Go to', label: 'All tasks', icon: Inbox, run: () => router.push('/tasks') },
  { id: 'board', group: 'Go to', label: 'Board', icon: Kanban, run: () => router.push('/board') },
  { id: 'calendar', group: 'Go to', label: 'Calendar', icon: CalendarDays, run: () => router.push('/calendar') },
  { id: 'dashboard', group: 'Go to', label: 'Dashboard', icon: LayoutDashboard, run: () => router.push('/dashboard') },
  { id: 'settings', group: 'Go to', label: 'Settings', icon: Settings, run: () => router.push('/settings') },
  ...categories.items.map((c) => ({
    id: `c${c.id}`,
    group: 'Categories',
    label: c.name,
    icon: iconOf(c.icon),
    iconClass: colorOf(c.color).text,
    run: () => router.push(`/categories/${c.id}`),
  })),
  ...labels.items.map((l) => ({
    id: `l${l.id}`,
    group: 'Labels',
    label: l.name,
    icon: Tag,
    iconClass: colorOf(l.color).text,
    run: () => router.push(`/labels/${l.id}`),
  })),
])

const items = computed(() => {
  const q = query.value.trim().toLowerCase()
  const cmds = q ? commands.value.filter((c) => c.label.toLowerCase().includes(q)) : commands.value.filter((c) => c.group !== 'Labels')
  const taskItems = results.value.map((t) => ({
    id: `t${t.id}`,
    group: 'Tasks',
    label: t.title,
    icon: t.status === 'done' ? CircleCheck : Circle,
    iconClass: t.status === 'done' ? 'text-green-500' : 'text-zinc-400',
    meta: t.due_date ? formatDue(t.due_date) : t.category?.name,
    run: () => ui.openTask(t.id),
  }))
  const list = [...taskItems, ...cmds]
  if (q) {
    list.push({ id: 'create', group: 'Actions', label: `Create task “${query.value.trim()}”`, icon: Plus, run: () => createFromQuery() })
  }
  return list
})

const grouped = computed(() => {
  const groups = []
  items.value.forEach((item, index) => {
    let g = groups.find((x) => x.name === item.group)
    if (!g) groups.push((g = { name: item.group, items: [] }))
    g.items.push({ ...item, index })
  })
  return groups
})

async function createFromQuery() {
  const title = query.value.trim()
  try {
    const task = await tasks.create({ title })
    ui.toast('Task added', { action: { label: 'Open', handler: () => ui.openTask(task.id) } })
  } catch {
    ui.openQuickAdd()
  }
}

watch(query, (q) => {
  active.value = 0
  clearTimeout(timer)
  if (!q.trim()) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  const mySeq = ++seq
  timer = setTimeout(async () => {
    try {
      const found = await tasks.search(q.trim())
      if (mySeq === seq) results.value = found
    } catch {
      if (mySeq === seq) results.value = []
    } finally {
      if (mySeq === seq) searching.value = false
    }
  }, 200)
})

watch(
  () => ui.paletteOpen,
  (open) => {
    if (open) {
      query.value = ''
      results.value = []
      active.value = 0
    }
  },
)

function run(item) {
  if (!item) return
  if (!item.keepOpen) ui.paletteOpen = false
  item.run()
}

function move(delta) {
  const n = items.value.length
  if (!n) return
  active.value = (active.value + delta + n) % n
  nextTick(() => listEl.value?.querySelector(`[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' }))
}
</script>

<template>
  <Modal :open="ui.paletteOpen" title="Command palette" bare size="max-w-xl" position="top" @close="ui.paletteOpen = false">
    <div class="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
      <Search class="size-4 shrink-0 text-zinc-400" />
      <input
        v-model="query"
        class="h-13 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-zinc-400 focus:outline-none"
        placeholder="Search tasks or type a command…"
        aria-label="Search"
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-list"
        :aria-activedescendant="items[active] ? `palette-${items[active].id}` : undefined"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="run(items[active])"
      />
      <Spinner v-if="searching" class="text-zinc-400" />
      <kbd class="kbd">Esc</kbd>
    </div>
    <div id="palette-list" ref="listEl" role="listbox" class="max-h-[min(26rem,60vh)] overflow-y-auto p-2 scrollbar-thin">
      <div v-for="g in grouped" :key="g.name" class="mb-1">
        <p class="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{{ g.name }}</p>
        <button
          v-for="item in g.items"
          :id="`palette-${item.id}`"
          :key="item.id"
          type="button"
          role="option"
          :aria-selected="active === item.index"
          :data-index="item.index"
          class="menu-item py-2"
          :data-active="active === item.index"
          @mousemove="active = item.index"
          @click="run(item)"
        >
          <component :is="item.icon" class="size-4 shrink-0" :class="item.iconClass ?? 'text-zinc-400'" />
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.meta" class="text-xs text-zinc-400">{{ item.meta }}</span>
          <kbd v-if="item.hint" class="kbd">{{ item.hint }}</kbd>
          <CornerDownLeft v-if="active === item.index" class="size-3.5 text-zinc-400" />
        </button>
      </div>
      <p v-if="!items.length" class="px-3 py-8 text-center text-[13px] text-zinc-500">No results.</p>
    </div>
  </Modal>
</template>
