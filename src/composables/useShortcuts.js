import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const GO = { t: '/today', u: '/upcoming', a: '/tasks', b: '/board', c: '/calendar', d: '/dashboard', s: '/settings' }

export function isTyping(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Global keyboard shortcuts for the app shell. */
export function useShortcuts() {
  const ui = useUiStore()
  const router = useRouter()
  let gPressedAt = 0

  function anyModalOpen() {
    return ui.paletteOpen || ui.quickAddOpen || ui.shortcutsOpen || !!document.querySelector('[aria-modal="true"]')
  }

  function onKey(e) {
    if (e.key === 'Escape' && ui.mobileNavOpen) {
      ui.mobileNavOpen = false
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      ui.paletteOpen = !ui.paletteOpen
      return
    }
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || anyModalOpen()) return

    const key = e.key
    if (gPressedAt && Date.now() - gPressedAt < 1000 && GO[key.toLowerCase()]) {
      e.preventDefault()
      gPressedAt = 0
      router.push(GO[key.toLowerCase()])
      return
    }
    gPressedAt = 0

    if (key === 'g') gPressedAt = Date.now()
    else if (key === 'n' || key === 'N') {
      e.preventDefault()
      ui.openQuickAdd()
    } else if (key === '/') {
      e.preventDefault()
      ui.paletteOpen = true
    } else if (key === '?') {
      e.preventDefault()
      ui.shortcutsOpen = true
    } else if (key === '[') {
      ui.sidebarCollapsed = !ui.sidebarCollapsed
    }
  }

  onMounted(() => document.addEventListener('keydown', onKey))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
}
