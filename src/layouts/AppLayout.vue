<script setup>
import { onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { CalendarDays, Kanban, Menu, MailWarning, Plus, Search, Star, CalendarRange } from '@lucide/vue'
import Sidebar from '@/components/app/Sidebar.vue'
import CommandPalette from '@/components/app/CommandPalette.vue'
import QuickAddDialog from '@/components/app/QuickAddDialog.vue'
import ShortcutsHelp from '@/components/app/ShortcutsHelp.vue'
import TaskDrawer from '@/components/tasks/TaskDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Logo from '@/components/ui/Logo.vue'
import { useShortcuts } from '@/composables/useShortcuts'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const auth = useAuthStore()
const categories = useCategoriesStore()
const labels = useLabelsStore()
const route = useRoute()

useShortcuts()

onMounted(() => {
  categories.fetch().catch(() => {})
  labels.fetch().catch(() => {})
})

watch(
  () => route.fullPath,
  () => {
    ui.mobileNavOpen = false
  },
)

const bottomNav = [
  { to: '/today', label: 'Today', icon: Star },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarRange },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
]
</script>

<template>
  <div class="flex min-h-dvh">
    <a href="#main" class="sr-only z-50 rounded-lg bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>

    <!-- Desktop sidebar -->
    <aside
      class="sticky top-0 hidden h-dvh shrink-0 border-r border-zinc-200/70 bg-zinc-50/80 transition-[width] duration-300 ease-out md:block dark:border-zinc-800/70 dark:bg-zinc-900/40"
      :class="ui.sidebarCollapsed ? 'w-[60px]' : 'w-64'"
    >
      <Sidebar :collapsed="ui.sidebarCollapsed" />
    </aside>

    <!-- Mobile drawer -->
    <Transition name="fade">
      <div v-if="ui.mobileNavOpen" class="fixed inset-0 z-40 bg-zinc-950/40 md:hidden" @click="ui.mobileNavOpen = false" />
    </Transition>
    <Transition
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
    >
      <aside v-if="ui.mobileNavOpen" class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-zinc-50 shadow-pop md:hidden dark:bg-zinc-900">
        <Sidebar mobile @navigate="ui.mobileNavOpen = false" />
      </aside>
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Mobile top bar -->
      <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200/70 bg-white/80 px-3 backdrop-blur-lg md:hidden dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <button type="button" class="btn-icon" aria-label="Open menu" @click="ui.mobileNavOpen = true"><Menu class="size-5" /></button>
        <RouterLink to="/today" class="rounded-lg"><Logo size="size-6" /></RouterLink>
        <button type="button" class="btn-icon ml-auto" aria-label="Search" @click="ui.paletteOpen = true"><Search class="size-5" /></button>
      </header>

      <div
        v-if="auth.user && !auth.isVerified"
        class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200/70 bg-amber-50 px-4 py-2 text-[13px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
      >
        <span class="flex items-center gap-2"><MailWarning class="size-4" /> Please verify your email address to secure your account.</span>
        <RouterLink to="/verify-email" class="font-semibold underline-offset-2 hover:underline">Verify now →</RouterLink>
      </div>

      <main id="main" class="flex-1 pb-24 md:pb-0">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="r.fullPath.split('?')[0]" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Mobile bottom nav -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden dark:border-zinc-800/70 dark:bg-zinc-950/90"
      aria-label="Primary"
    >
      <RouterLink
        v-for="item in bottomNav.slice(0, 2)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
        :class="route.path === item.to ? 'text-accent-600 dark:text-accent-400' : 'text-zinc-500'"
      >
        <component :is="item.icon" class="size-5" /> {{ item.label }}
      </RouterLink>
      <div class="flex items-center justify-center">
        <button
          type="button"
          class="-mt-6 flex size-13 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white active:scale-95 dark:ring-zinc-950"
          aria-label="New task"
          @click="ui.openQuickAdd()"
        >
          <Plus class="size-6" />
        </button>
      </div>
      <RouterLink
        v-for="item in bottomNav.slice(2)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
        :class="route.path === item.to ? 'text-accent-600 dark:text-accent-400' : 'text-zinc-500'"
      >
        <component :is="item.icon" class="size-5" /> {{ item.label }}
      </RouterLink>
    </nav>

    <TaskDrawer />
    <CommandPalette />
    <QuickAddDialog />
    <ShortcutsHelp />
    <ConfirmDialog />
  </div>
</template>
