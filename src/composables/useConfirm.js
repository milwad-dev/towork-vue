import { reactive } from 'vue'

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  danger: false,
})
let resolver = null

/** Promise-based confirm dialog: `if (await confirm({ title })) { ... }` */
export function useConfirm() {
  function confirm({ title, message = '', confirmLabel = 'Confirm', danger = false }) {
    Object.assign(state, { open: true, title, message, confirmLabel, danger })
    return new Promise((r) => (resolver = r))
  }
  function resolve(value) {
    state.open = false
    resolver?.(value)
    resolver = null
  }
  return { state, confirm, resolve }
}
