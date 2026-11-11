<script setup>
import { computed, nextTick, onBeforeUnmount, ref, toRaw, watch } from 'vue'
import { Bell, BellOff, Check, CircleDot, Clock, GripVertical, Plus, Trash2, X } from '@lucide/vue'
import { formatDistanceToNow } from 'date-fns'
import DuePicker from './DuePicker.vue'
import PriorityPicker from './PriorityPicker.vue'
import CategoryPicker from './CategoryPicker.vue'
import LabelPicker from './LabelPicker.vue'
import TaskCheckbox from './TaskCheckbox.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { STATUSES } from '@/lib/constants'
import { fromLocalInput, toLocalInput } from '@/lib/dates'
import { errorMessage } from '@/lib/api'
import { useTaskActions } from '@/composables/useTaskActions'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const tasks = useTasksStore()
const actions = useTaskActions()

const task = ref(null)
const loading = ref(false)
const notFound = ref(false)
const saveState = ref('idle') // idle | saving | saved
const titleEl = ref(null)
const newSubtask = ref('')
const editingSubtask = ref(null)
let saveTimer = null
let savedTimer = null
let pending = {}

const open = computed(() => ui.openTaskId !== null)

/** Deep copy that works on Vue reactive proxies (structuredClone does not). */
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(toRaw(value))))

async function load(id) {
  loading.value = true
  notFound.value = false
  task.value = clone(tasks.items.find((t) => t.id === id)) ?? null
  try {
    task.value = clone(await tasks.get(id))
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true
    else ui.toast(errorMessage(e), { type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(
  () => ui.openTaskId,
  async (id, prev) => {
    if (prev && Object.keys(pending).length) await flush(prev)
    if (id) load(id)
    else task.value = null
  },
)

/** Queue a field change; text fields are debounced, others save at once. */
function change(field, value, { debounce = false } = {}) {
  if (!task.value) return
  task.value[field] = value
  pending[field] = value
  clearTimeout(saveTimer)
  if (debounce) saveTimer = setTimeout(() => flush(), 700)
  else flush()
}

async function flush(id = task.value?.id) {
  clearTimeout(saveTimer)
  const patch = pending
  pending = {}
  if (!id || !Object.keys(patch).length) return
  if ('title' in patch && !patch.title.trim()) return // never save an empty title
  saveState.value = 'saving'
  try {
    const updated = await tasks.update(id, patch)
    if (task.value?.id === id) {
      // keep local edits that happened while saving
      task.value = { ...clone(updated), ...pending }
    }
    saveState.value = 'saved'
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => (saveState.value = 'idle'), 1500)
  } catch (e) {
    saveState.value = 'idle'
    ui.toast(errorMessage(e), { type: 'error' })
    if (task.value?.id === id) load(id)
  }
}

const labelIds = computed({
  get: () => task.value?.labels?.map((l) => l.id) ?? [],
  set: (ids) => {
    task.value.labels = ids.map((id) => ({ id }))
    change('label_ids', ids)
  },
})

const reminder = computed(() => toLocalInput(task.value?.remind_at))

async function toggleDone() {
  await actions.toggle(task.value)
  const fresh = tasks.items.find((t) => t.id === task.value.id)
  if (fresh) task.value = clone(fresh)
  else task.value.status = task.value.status === 'done' ? 'todo' : 'done'
}

async function remove() {
  await flush()
  await actions.remove(task.value)
}

// Subtasks
async function addSubtask() {
  const title = newSubtask.value.trim()
  if (!title) return
  newSubtask.value = ''
  try {
    const sub = await tasks.addSubtask(task.value.id, title)
    task.value.subtasks = [...(task.value.subtasks ?? []), sub]
  } catch (e) {
    ui.toast(errorMessage(e), { type: 'error' })
  }
}

async function updateSubtask(sub, patch) {
  const before = { ...sub }
  Object.assign(sub, patch)
  try {
    await tasks.updateSubtask(task.value.id, sub.id, patch)
  } catch (e) {
    Object.assign(sub, before)
    ui.toast(errorMessage(e), { type: 'error' })
  }
}

async function renameSubtask(sub, title) {
  editingSubtask.value = null
  title = title.trim()
  if (!title || title === sub.title) return
  await updateSubtask(sub, { title })
}

async function removeSubtask(sub) {
  const list = task.value.subtasks
  task.value.subtasks = list.filter((s) => s.id !== sub.id)
  try {
    await tasks.removeSubtask(task.value.id, sub.id)
  } catch (e) {
    task.value.subtasks = list
    ui.toast(errorMessage(e), { type: 'error' })
  }
}

const subtaskProgress = computed(() => {
  const list = task.value?.subtasks ?? []
  return list.length ? Math.round((list.filter((s) => s.is_completed).length / list.length) * 100) : 0
})

function close() {
  flush()
  ui.closeTask()
}

function onKey(e) {
  if (e.key === 'Escape' && open.value && !document.querySelector('[role="dialog"][aria-modal="true"]:not([data-drawer])')) {
    if (document.activeElement?.closest?.('.popover')) return
    close()
  }
}
document.addEventListener('keydown', onKey)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  flush()
})

function autoGrow(e) {
  e.target.style.height = 'auto'
  e.target.style.height = `${e.target.scrollHeight}px`
}
watch(task, async () => {
  await nextTick()
  document.querySelectorAll('[data-autogrow]').forEach((el) => autoGrow({ target: el }))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-[1px] dark:bg-black/40 lg:bg-transparent lg:backdrop-blur-none" @click="close" />
    </Transition>
    <Transition name="drawer">
      <aside
        v-if="open"
        role="dialog"
        aria-modal="false"
        data-drawer
        aria-label="Task details"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900"
      >
        <!-- Header -->
        <header class="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 px-4 dark:border-zinc-800">
          <template v-if="task">
            <button
              type="button"
              class="btn btn-sm"
              :class="task.status === 'done' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:text-green-400' : 'btn-secondary'"
              @click="toggleDone"
            >
              <Check class="size-3.5" /> {{ task.status === 'done' ? 'Completed' : 'Mark complete' }}
            </button>
          </template>
          <span class="ml-2 flex items-center gap-1.5 text-xs text-zinc-400" aria-live="polite">
            <template v-if="saveState === 'saving'"><Spinner /> Saving…</template>
            <template v-else-if="saveState === 'saved'"><Check class="size-3.5 text-green-500" /> Saved</template>
          </span>
          <div class="ml-auto flex items-center gap-1">
            <button v-if="task" type="button" class="btn-icon hover:text-red-600" aria-label="Delete task" title="Delete task" @click="remove">
              <Trash2 class="size-4" />
            </button>
            <button type="button" class="btn-icon" aria-label="Close" title="Close (Esc)" @click="close"><X class="size-4" /></button>
          </div>
        </header>

        <!-- Body -->
        <div v-if="notFound" class="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p class="font-medium">This task no longer exists.</p>
          <button type="button" class="btn btn-secondary mt-4" @click="close">Close</button>
        </div>

        <div v-else-if="!task" class="space-y-4 p-6">
          <div class="skeleton h-7 w-3/4" />
          <div class="skeleton h-4 w-1/2" />
          <div class="skeleton h-24 w-full" />
        </div>

        <div v-else class="flex-1 overflow-y-auto scrollbar-thin">
          <div class="px-6 pt-6">
            <textarea
              ref="titleEl"
              :value="task.title"
              data-autogrow
              rows="1"
              class="w-full resize-none bg-transparent text-xl leading-snug font-semibold tracking-tight focus:outline-none"
              :class="task.status === 'done' && 'text-zinc-400 line-through'"
              aria-label="Title"
              maxlength="255"
              @input="autoGrow($event), change('title', $event.target.value, { debounce: true })"
              @keydown.enter.prevent="$event.target.blur()"
              @blur="flush()"
            />
            <p v-if="!task.title.trim()" class="field-error">A title is required.</p>
          </div>

          <!-- Properties -->
          <dl class="mt-4 grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-2.5 px-6 text-[13px]">
            <dt class="flex items-center gap-2 text-zinc-500"><CircleDot class="size-4" /> Status</dt>
            <dd class="flex flex-wrap gap-1">
              <button
                v-for="s in STATUSES"
                :key="s.value"
                type="button"
                class="btn btn-sm border"
                :class="task.status === s.value ? 'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white' : 'border-transparent font-normal text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                :aria-pressed="task.status === s.value"
                @click="change('status', s.value)"
              >
                <span class="size-2 rounded-full" :class="s.dot" /> {{ s.label }}
              </button>
            </dd>

            <dt class="text-zinc-500">Due</dt>
            <dd>
              <DuePicker
                :date="task.due_date"
                :time="task.due_time"
                with-time
                @update:date="(v) => change('due_date', v)"
                @update:time="(v) => change('due_time', v)"
              />
            </dd>

            <dt class="text-zinc-500">Priority</dt>
            <dd><PriorityPicker :model-value="task.priority" @update:model-value="(v) => change('priority', v)" /></dd>

            <dt class="text-zinc-500">Category</dt>
            <dd><CategoryPicker :model-value="task.category_id" @update:model-value="(v) => change('category_id', v)" /></dd>

            <dt class="text-zinc-500">Labels</dt>
            <dd><LabelPicker v-model="labelIds" /></dd>

            <dt class="flex items-center gap-2 text-zinc-500"><Bell class="size-4" /> Reminder</dt>
            <dd class="flex items-center gap-1.5">
              <input
                type="datetime-local"
                class="input h-8 w-auto text-[13px]"
                :value="reminder"
                aria-label="Reminder"
                @change="change('remind_at', fromLocalInput($event.target.value))"
              />
              <button v-if="task.remind_at" type="button" class="btn-icon" aria-label="Remove reminder" title="Remove reminder" @click="change('remind_at', null)">
                <BellOff class="size-4" />
              </button>
            </dd>
          </dl>

          <!-- Description -->
          <div class="mt-6 px-6">
            <h3 class="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Description</h3>
            <textarea
              :value="task.description ?? ''"
              data-autogrow
              rows="3"
              class="input min-h-24 resize-none text-[14px] leading-relaxed"
              placeholder="Add more details, links or notes…"
              aria-label="Description"
              @input="autoGrow($event), change('description', $event.target.value || null, { debounce: true })"
              @blur="flush()"
            />
          </div>

          <!-- Subtasks -->
          <div class="mt-6 px-6 pb-8">
            <div class="mb-2 flex items-center justify-between">
              <h3 class="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Subtasks
                <span v-if="task.subtasks?.length" class="ml-1 font-medium normal-case tracking-normal">
                  {{ task.subtasks.filter((s) => s.is_completed).length }}/{{ task.subtasks.length }}
                </span>
              </h3>
              <div v-if="task.subtasks?.length" class="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div class="h-full rounded-full bg-green-500 transition-all duration-500" :style="{ width: `${subtaskProgress}%` }" />
              </div>
            </div>
            <ul class="space-y-0.5">
              <li v-for="sub in task.subtasks" :key="sub.id" class="group/sub flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                <GripVertical class="size-3.5 text-zinc-300 opacity-0 group-hover/sub:opacity-100 dark:text-zinc-600" aria-hidden="true" />
                <TaskCheckbox :checked="sub.is_completed" label="Complete subtask" @toggle="updateSubtask(sub, { is_completed: !sub.is_completed })" />
                <input
                  v-if="editingSubtask === sub.id"
                  :value="sub.title"
                  class="min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none"
                  aria-label="Subtask title"
                  autofocus
                  @keydown.enter.prevent="renameSubtask(sub, $event.target.value)"
                  @keydown.esc.stop.prevent="editingSubtask = null"
                  @blur="renameSubtask(sub, $event.target.value)"
                />
                <button
                  v-else
                  type="button"
                  class="min-w-0 flex-1 truncate text-left text-[13px]"
                  :class="sub.is_completed && 'text-zinc-400 line-through'"
                  title="Click to rename"
                  @click="editingSubtask = sub.id"
                >
                  {{ sub.title }}
                </button>
                <button type="button" class="btn-icon size-6 opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100 hover:text-red-600" aria-label="Delete subtask" @click="removeSubtask(sub)">
                  <X class="size-3.5" />
                </button>
              </li>
            </ul>
            <form class="mt-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5" @submit.prevent="addSubtask">
              <span class="w-3.5" />
              <Plus class="size-[18px] text-zinc-400" />
              <input
                v-model="newSubtask"
                class="min-w-0 flex-1 bg-transparent text-[13px] placeholder:text-zinc-400 focus:outline-none"
                placeholder="Add a subtask and press Enter"
                aria-label="New subtask"
                maxlength="255"
              />
            </form>
          </div>
        </div>

        <footer v-if="task" class="flex shrink-0 items-center gap-1.5 border-t border-zinc-100 px-6 py-3 text-xs text-zinc-400 dark:border-zinc-800">
          <Clock class="size-3.5" />
          Created {{ formatDistanceToNow(new Date(task.created_at), { addSuffix: true }) }}
          <template v-if="task.completed_at"> · Completed {{ formatDistanceToNow(new Date(task.completed_at), { addSuffix: true }) }}</template>
          <span v-if="loading" class="ml-auto"><Spinner /></span>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
