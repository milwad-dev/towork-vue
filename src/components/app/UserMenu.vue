<script setup>
import { useRouter } from 'vue-router'
import { ChevronsUpDown, Keyboard, LogOut, Monitor, Moon, Settings, Sun } from '@lucide/vue'
import Popover from '@/components/ui/Popover.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

defineProps({ collapsed: Boolean })

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const themes = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

async function logout(close) {
  close()
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <Popover width="w-64" :align="collapsed ? 'start' : 'start'">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70"
        :aria-expanded="open"
        aria-haspopup="menu"
        aria-label="Account menu"
        @click="toggle"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
          {{ auth.initials }}
        </span>
        <template v-if="!collapsed">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium">{{ auth.user?.name }}</span>
            <span class="block truncate text-xs text-zinc-500">{{ auth.user?.email }}</span>
          </span>
          <ChevronsUpDown class="size-4 shrink-0 text-zinc-400" />
        </template>
      </button>
    </template>
    <template #default="{ close }">
      <div role="menu">
        <div class="px-2.5 pt-1.5 pb-2">
          <p class="truncate text-[13px] font-medium">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-zinc-500">{{ auth.user?.email }}</p>
        </div>
        <div class="mx-1.5 mb-1.5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" role="radiogroup" aria-label="Theme">
          <button
            v-for="t in themes"
            :key="t.value"
            type="button"
            role="radio"
            :aria-checked="ui.theme === t.value"
            class="flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition"
            :class="ui.theme === t.value ? 'bg-white text-zinc-900 shadow-soft dark:bg-zinc-700 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            @click="ui.theme = t.value"
          >
            <component :is="t.icon" class="size-3.5" /> {{ t.label }}
          </button>
        </div>
        <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <RouterLink to="/settings" class="menu-item" role="menuitem" @click="close"><Settings class="size-4 text-zinc-400" /> Settings</RouterLink>
        <button type="button" class="menu-item" role="menuitem" @click="close(), (ui.shortcutsOpen = true)">
          <Keyboard class="size-4 text-zinc-400" /> Keyboard shortcuts <span class="kbd ml-auto">?</span>
        </button>
        <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <button type="button" class="menu-item text-red-600 dark:text-red-400" role="menuitem" @click="logout(close)">
          <LogOut class="size-4" /> Sign out
        </button>
      </div>
    </template>
  </Popover>
</template>
