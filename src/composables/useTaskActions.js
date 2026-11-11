import { errorMessage } from '@/lib/api'
import { useConfirm } from '@/composables/useConfirm'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

/** Shared task actions with toasts, undo and confirmation. */
export function useTaskActions() {
  const tasks = useTasksStore()
  const ui = useUiStore()
  const { confirm } = useConfirm()

  async function toggle(task) {
    const wasDone = task.status === 'done'
    try {
      await tasks.toggle(task.id)
      if (!wasDone) {
        ui.toast('Task completed', {
          action: { label: 'Undo', handler: () => tasks.toggle(task.id).catch(() => {}) },
        })
      }
    } catch (e) {
      ui.toast(errorMessage(e), { type: 'error' })
    }
  }

  async function update(task, patch, message) {
    try {
      const updated = await tasks.update(task.id, patch)
      if (message) ui.toast(message)
      return updated
    } catch (e) {
      ui.toast(errorMessage(e), { type: 'error' })
      return null
    }
  }

  async function remove(task) {
    const ok = await confirm({
      title: 'Delete task?',
      message: `“${task.title}” and its subtasks will be permanently deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return false
    try {
      await tasks.remove(task.id)
      if (ui.openTaskId === task.id) ui.closeTask()
      ui.toast('Task deleted')
      return true
    } catch (e) {
      ui.toast(errorMessage(e), { type: 'error' })
      return false
    }
  }

  return { toggle, update, remove }
}
