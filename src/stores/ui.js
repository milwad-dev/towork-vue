import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_KEY = 'towork.theme'
const SIDEBAR_KEY = 'towork.sidebar'

function read(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

let toastId = 0

export const useUiStore = defineStore('ui', () => {
  /** 'system' | 'light' | 'dark' */
  const theme = ref(read(THEME_KEY, 'system'))
  const sidebarCollapsed = ref(read(SIDEBAR_KEY, '0') === '1')
  const mobileNavOpen = ref(false)
  const paletteOpen = ref(false)
  const shortcutsOpen = ref(false)
  const quickAddOpen = ref(false)
  /** Defaults for the global quick-add dialog (e.g. a due date from the calendar). */
  const quickAddDefaults = ref({})
  /** Id of the task open in the detail drawer. */
  const openTaskId = ref(null)
  const toasts = ref([])

  const media = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null

  function applyTheme() {
    if (typeof document === 'undefined') return
    const dark = theme.value === 'dark' || (theme.value === 'system' && !!media?.matches)
    document.documentElement.classList.toggle('dark', dark)
  }
  media?.addEventListener?.('change', applyTheme)
  watch(
    theme,
    (value) => {
      write(THEME_KEY, value)
      applyTheme()
    },
    { immediate: true },
  )
  watch(sidebarCollapsed, (v) => write(SIDEBAR_KEY, v ? '1' : '0'))

  function cycleTheme() {
    theme.value = { system: 'light', light: 'dark', dark: 'system' }[theme.value] ?? 'system'
  }

  /**
   * Show a toast.
   * @param {string} message
   * @param {{ type?: 'success'|'error'|'info', action?: { label: string, handler: Function }, timeout?: number }} [opts]
   */
  function toast(message, opts = {}) {
    const id = ++toastId
    toasts.value.push({ id, message, type: opts.type ?? 'success', action: opts.action })
    setTimeout(() => dismissToast(id), opts.timeout ?? (opts.action ? 6000 : 3500))
    return id
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function openTask(id) {
    openTaskId.value = id
  }

  function closeTask() {
    openTaskId.value = null
  }

  function openQuickAdd(defaults = {}) {
    quickAddDefaults.value = defaults
    quickAddOpen.value = true
  }

  return {
    theme,
    sidebarCollapsed,
    mobileNavOpen,
    paletteOpen,
    shortcutsOpen,
    quickAddOpen,
    quickAddDefaults,
    openTaskId,
    toasts,
    cycleTheme,
    toast,
    dismissToast,
    openTask,
    closeTask,
    openQuickAdd,
  }
})
