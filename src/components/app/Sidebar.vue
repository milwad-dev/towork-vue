<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarDays,
  CalendarRange,
  Ellipsis,
  Inbox,
  Kanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
} from '@lucide/vue'
import Logo from '@/components/ui/Logo.vue'
import Popover from '@/components/ui/Popover.vue'
import CollectionDialog from './CollectionDialog.vue'
import UserMenu from './UserMenu.vue'
import { colorOf, iconOf } from '@/lib/constants'
import { errorMessage } from '@/lib/api'
import { useConfirm } from '@/composables/useConfirm'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useUiStore } from '@/stores/ui'

defineProps({ collapsed: Boolean, mobile: Boolean })
const emit = defineEmits(['navigate'])

const ui = useUiStore()
const categories = useCategoriesStore()
const labels = useLabelsStore()
const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const nav = [
  { to: '/today', label: 'Today', icon: Star, key: 't' },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarRange, key: 'u' },
  { to: '/tasks', label: 'All tasks', icon: Inbox, key: 'a' },
  { to: '/board', label: 'Board', icon: Kanban, key: 'b' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, key: 'c' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'd' },
]

const dialog = ref({ open: false, kind: 'category', item: null })
function openDialog(kind, item = null) {
  dialog.value = { open: true, kind, item }
}

async function removeItem(kind, item) {
  const ok = await confirm({
    title: `Delete “${item.name}”?`,
    message:
      kind === 'category'
        ? 'Its tasks will stay but become uncategorized. This cannot be undone.'
        : 'The label will be removed from all tasks. This cannot be undone.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await (kind === 'category' ? categories : labels).remove(item.id)
    ui.toast(`Deleted “${item.name}”`)
    if (route.name === kind && Number(route.params.id) === item.id) router.push('/tasks')
  } catch (e) {
    ui.toast(errorMessage(e), { type: 'error' })
  }
}

function isActive(to) {
  return route.path === to
}
</script>

<template>
  <nav class="flex h-full flex-col" aria-label="Main">
    <!-- Header -->
    <div class="flex h-14 shrink-0 items-center gap-2 px-3" :class="collapsed && 'justify-center px-0'">
      <RouterLink v-if="!collapsed" to="/today" class="rounded-lg px-1.5" @click="emit('navigate')"><Logo /></RouterLink>
      <button
        v-if="!mobile"
        type="button"
        class="btn-icon"
        :class="!collapsed && 'ml-auto'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar  [' : 'Collapse sidebar  ['"
        @click="ui.sidebarCollapsed = !ui.sidebarCollapsed"
      >
        <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="size-4" />
      </button>
    </div>

    <!-- Actions -->
    <div class="space-y-1 px-3 pb-3" :class="collapsed && 'px-2'">
      <button
        type="button"
        class="btn btn-primary w-full"
        :class="collapsed && 'px-0'"
        :title="collapsed ? 'New task (N)' : undefined"
        aria-label="New task"
        @click="ui.openQuickAdd(), emit('navigate')"
      >
        <Plus class="size-4" />
        <template v-if="!collapsed">
          New task <span class="ml-auto rounded bg-white/15 px-1.5 text-[11px]">N</span>
        </template>
      </button>
      <button
        type="button"
        class="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200"
        :class="collapsed && 'justify-center px-0'"
        aria-label="Search"
        @click="ui.paletteOpen = true, emit('navigate')"
      >
        <Search class="size-4" />
        <template v-if="!collapsed">
          Search
          <span class="ml-auto flex gap-0.5"><span class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}</span><span class="kbd">K</span></span>
        </template>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin" :class="collapsed && 'px-2'">
      <ul class="space-y-0.5">
        <li v-for="item in nav" :key="item.to">
          <RouterLink
            :to="item.to"
            class="group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition"
            :class="[
              isActive(item.to)
                ? 'bg-white text-zinc-900 shadow-soft ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700/60'
                : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100',
              collapsed && 'justify-center px-0',
            ]"
            :title="collapsed ? item.label : undefined"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            @click="emit('navigate')"
          >
            <component :is="item.icon" class="size-4 shrink-0" :class="isActive(item.to) ? 'text-accent-600 dark:text-accent-400' : ''" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Categories & labels -->
      <template v-for="section in [{ kind: 'category', title: 'Categories', store: categories }, { kind: 'label', title: 'Labels', store: labels }]" :key="section.kind">
        <div v-if="!collapsed" class="mt-6 mb-1 flex items-center justify-between px-2.5">
          <h3 class="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">{{ section.title }}</h3>
          <button type="button" class="btn-icon size-6" :aria-label="`New ${section.kind}`" :title="`New ${section.kind}`" @click="openDialog(section.kind)">
            <Plus class="size-3.5" />
          </button>
        </div>
        <div v-else class="mx-2 my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

        <ul class="space-y-0.5">
          <template v-if="!section.store.loaded && section.store.loading">
            <li v-for="i in 3" :key="i" class="flex h-8 items-center gap-2.5 px-2.5"><span class="skeleton size-2.5 rounded-full" /><span v-if="!collapsed" class="skeleton h-3 flex-1" /></li>
          </template>
          <li v-for="item in section.store.items" :key="item.id" class="group/item relative">
            <RouterLink
              :to="`/${section.kind === 'category' ? 'categories' : 'labels'}/${item.id}`"
              class="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition"
              :class="[
                route.name === section.kind && Number(route.params.id) === item.id
                  ? 'bg-white font-medium text-zinc-900 shadow-soft ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700/60'
                  : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100',
                collapsed && 'justify-center px-0',
              ]"
              :title="collapsed ? item.name : undefined"
              @click="emit('navigate')"
            >
              <component :is="iconOf(item.icon)" v-if="section.kind === 'category'" class="size-4 shrink-0" :class="colorOf(item.color).text" />
              <Tag v-else class="size-4 shrink-0" :class="colorOf(item.color).text" />
              <template v-if="!collapsed">
                <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
                <span class="text-xs text-zinc-400 tabular-nums group-hover/item:opacity-0">
                  {{ section.kind === 'category' ? item.open_tasks_count || '' : item.tasks_count || '' }}
                </span>
              </template>
            </RouterLink>
            <Popover v-if="!collapsed" width="w-40" align="end" trigger-class="absolute top-1 right-1">
              <template #trigger="{ toggle, open }">
                <button
                  type="button"
                  class="flex size-6 items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover/item:opacity-100 hover:bg-zinc-200 hover:text-zinc-700 focus-visible:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  :class="open && 'opacity-100'"
                  :aria-label="`Options for ${item.name}`"
                  @click.prevent="toggle"
                >
                  <Ellipsis class="size-4" />
                </button>
              </template>
              <template #default="{ close }">
                <button type="button" class="menu-item" @click="close(), openDialog(section.kind, item)"><Pencil class="size-3.5 text-zinc-400" /> Edit</button>
                <button type="button" class="menu-item text-red-600 dark:text-red-400" @click="close(), removeItem(section.kind, item)"><Trash2 class="size-3.5" /> Delete</button>
              </template>
            </Popover>
          </li>
          <li v-if="section.store.loaded && !section.store.items.length && !collapsed">
            <button
              type="button"
              class="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-300"
              @click="openDialog(section.kind)"
            >
              <Plus class="size-4" /> Add {{ section.kind === 'category' ? 'a category' : 'a label' }}
            </button>
          </li>
        </ul>
      </template>
    </div>

    <div class="shrink-0 border-t border-zinc-200/70 p-2 dark:border-zinc-800/70">
      <UserMenu :collapsed="collapsed" />
    </div>

    <CollectionDialog :open="dialog.open" :kind="dialog.kind" :item="dialog.item" @close="dialog.open = false" />
  </nav>
</template>
