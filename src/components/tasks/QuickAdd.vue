<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { CornerDownLeft, Plus } from '@lucide/vue'
import Spinner from '@/components/ui/Spinner.vue'
import DuePicker from './DuePicker.vue'
import PriorityPicker from './PriorityPicker.vue'
import CategoryPicker from './CategoryPicker.vue'
import LabelPicker from './LabelPicker.vue'
import { errorMessage, fieldErrors } from '@/lib/api'
import { parseQuickAdd } from '@/lib/quickAdd'
import { useCategoriesStore, useLabelsStore } from '@/stores/collection'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

/**
 * Inline task composer. Type a title and press Enter. Supports `today`,
 * `tomorrow`, `!high`, `#category` and `@label` shortcuts, or the pickers.
 */
const props = defineProps({
  defaults: { type: Object, default: () => ({}) },
  /** Always show the expanded composer (used in dialogs). */
  expanded: Boolean,
  placeholder: { type: String, default: 'Add a task' },
})
const emit = defineEmits(['created', 'cancel'])

const tasks = useTasksStore()
const categories = useCategoriesStore()
const labels = useLabelsStore()
const ui = useUiStore()

const input = ref(null)
const focused = ref(false)
const saving = ref(false)
const error = ref('')

function blank() {
  return {
    title: '',
    description: '',
    due_date: props.defaults.due_date ?? null,
    due_time: null,
    priority: props.defaults.priority ?? 1,
    category_id: props.defaults.category_id ?? null,
    label_ids: props.defaults.label_ids ? [...props.defaults.label_ids] : [],
  }
}
const form = reactive(blank())

const open = computed(() => props.expanded || focused.value || !!form.title)
const parsed = computed(() => parseQuickAdd(form.title, { categories: categories.items, labels: labels.items }))
const hints = computed(() => {
  const h = []
  const p = parsed.value
  if (p.due_date && p.due_date !== form.due_date) h.push('date')
  if (p.priority && p.priority !== form.priority) h.push('priority')
  if (p.category_id && p.category_id !== form.category_id) h.push(`#${categories.find(p.category_id)?.name}`)
  for (const id of p.label_ids) if (!form.label_ids.includes(id)) h.push(`@${labels.find(id)?.name}`)
  return h
})

async function submit() {
  const p = parsed.value
  if (!p.title || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      title: p.title,
      description: form.description || null,
      due_date: p.due_date ?? form.due_date,
      due_time: form.due_time,
      priority: p.priority ?? form.priority,
      category_id: p.category_id ?? form.category_id,
      label_ids: [...new Set([...form.label_ids, ...p.label_ids])],
    }
    if (props.defaults.status) payload.status = props.defaults.status
    const task = await tasks.create(payload)
    emit('created', task)
    ui.toast('Task added', { action: { label: 'Open', handler: () => ui.openTask(task.id) } })
    Object.assign(form, blank())
    await nextTick()
    input.value?.focus()
  } catch (e) {
    const errs = fieldErrors(e)
    error.value = Object.values(errs)[0] || errorMessage(e)
  } finally {
    saving.value = false
  }
}

function cancel() {
  Object.assign(form, blank())
  error.value = ''
  input.value?.blur()
  emit('cancel')
}

function onFocusOut(e) {
  // Stay open while focus moves into a picker (teleported popovers count as outside).
  if (!e.currentTarget.contains(e.relatedTarget) && !e.relatedTarget?.closest?.('.popover')) focused.value = false
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <form
    class="rounded-xl border transition"
    :class="open ? 'border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'"
    @submit.prevent="submit"
    @focusin="focused = true"
    @focusout="onFocusOut"
    @keydown.esc.prevent="cancel"
  >
    <div class="flex items-center gap-3 px-3 py-2.5">
      <span class="flex size-[18px] shrink-0 items-center justify-center rounded-full text-accent-600 dark:text-accent-400" :class="open ? 'border-[1.5px] border-dashed border-zinc-300 dark:border-zinc-600' : 'bg-accent-500/10'">
        <Plus v-if="!open" class="size-3.5" stroke-width="2.5" />
      </span>
      <input
        ref="input"
        v-model="form.title"
        class="min-w-0 flex-1 bg-transparent text-[14px] leading-6 placeholder:text-zinc-400 focus:outline-none"
        :placeholder="open ? 'Task name' : placeholder"
        aria-label="New task title"
        maxlength="255"
        data-quick-add
      />
    </div>
    <div v-if="open" class="px-3 pb-3 pl-[42px]">
      <input
        v-model="form.description"
        class="w-full bg-transparent text-[13px] text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-400"
        placeholder="Description"
        aria-label="Description"
      />
      <p v-if="hints.length" class="mt-1.5 text-xs text-accent-600 dark:text-accent-400">
        Detected: {{ hints.join(', ') }}
      </p>
      <p v-else-if="!form.title" class="mt-1.5 hidden text-xs text-zinc-400 sm:block">
        Tip: try “Call Sam <span class="font-medium">tomorrow !high #Work @phone</span>”
      </p>
      <p v-if="error" class="field-error">{{ error }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-1.5">
        <DuePicker v-model:date="form.due_date" v-model:time="form.due_time" with-time />
        <PriorityPicker v-model="form.priority" compact />
        <CategoryPicker v-model="form.category_id" />
        <LabelPicker v-model="form.label_ids" />
        <div class="ml-auto flex items-center gap-1.5 max-sm:mt-1 max-sm:w-full max-sm:justify-end">
          <button type="button" class="btn btn-ghost btn-sm" @click="cancel">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="!parsed.title || saving">
            <Spinner v-if="saving" /> Add task <CornerDownLeft class="size-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  </form>
</template>
