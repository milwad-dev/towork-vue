import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/lib/api'
import { todayISO } from '@/lib/dates'
import { useCategoriesStore, useLabelsStore } from './collection'

/** Serialize filter params for the API (arrays → comma lists, drop empties). */
export function toQuery(params = {}) {
  const query = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) query[key] = value.join(',')
    } else {
      query[key] = value
    }
  }
  return query
}

/** Client-side check that mirrors the API filters, used for optimistic inserts. */
export function matchesParams(task, params = {}, today = todayISO()) {
  const list = (v) => (Array.isArray(v) ? v : String(v).split(',')).filter(Boolean)
  if (params.status && list(params.status).length && !list(params.status).includes(task.status)) return false
  if (params.priority && list(params.priority).length && !list(params.priority).map(Number).includes(task.priority))
    return false
  if (params.category_id) {
    if (params.category_id === 'none' ? task.category_id : task.category_id !== Number(params.category_id))
      return false
  }
  if (params.label_id && !task.labels?.some((l) => l.id === Number(params.label_id))) return false
  if (params.search) {
    const q = params.search.toLowerCase()
    if (!task.title.toLowerCase().includes(q) && !(task.description ?? '').toLowerCase().includes(q)) return false
  }
  const due = task.due_date
  if (params.date_from && (!due || due < params.date_from)) return false
  if (params.date_to && (!due || due > params.date_to)) return false
  switch (params.due) {
    case 'today':
      return due === today
    case 'overdue':
      return !!due && due < today && task.status !== 'done'
    case 'upcoming':
      return !!due && due > today
    case 'scheduled':
      return !!due
    case 'none':
      return !due
    case 'week': {
      if (!due) return false
      const end = new Date(today)
      end.setDate(end.getDate() + 6)
      return due >= today && due <= end.toISOString().slice(0, 10)
    }
  }
  return true
}

export const useTasksStore = defineStore('tasks', () => {
  const items = ref([])
  const meta = ref(null)
  const params = ref({})
  const loading = ref(false)
  const loadingMore = ref(false)
  let requestSeq = 0

  const hasMore = computed(() => !!meta.value && meta.value.current_page < meta.value.last_page)

  function touchCounts() {
    useCategoriesStore().refreshSoon()
    useLabelsStore().refreshSoon()
  }

  /** Load the first page of tasks for a view. */
  async function fetch(newParams = {}) {
    const seq = ++requestSeq
    params.value = { ...newParams }
    loading.value = true
    try {
      const { data } = await api.get('/tasks', { params: toQuery(params.value) })
      if (seq !== requestSeq) return // a newer request superseded this one
      items.value = data.data
      meta.value = data.meta ?? null
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const { data } = await api.get('/tasks', {
        params: { ...toQuery(params.value), page: meta.value.current_page + 1 },
      })
      const known = new Set(items.value.map((t) => t.id))
      items.value.push(...data.data.filter((t) => !known.has(t.id)))
      meta.value = data.meta ?? null
    } finally {
      loadingMore.value = false
    }
  }

  async function search(term, perPage = 8) {
    const { data } = await api.get('/tasks', { params: { search: term, per_page: perPage, sort: 'created_at' } })
    return data.data
  }

  function replace(task) {
    const idx = items.value.findIndex((t) => t.id === task.id)
    if (idx !== -1) items.value[idx] = task
  }

  function local(id) {
    return items.value.find((t) => t.id === id)
  }

  async function get(id) {
    const { data } = await api.get(`/tasks/${id}`)
    replace(data.data)
    return data.data
  }

  async function create(payload) {
    const { data } = await api.post('/tasks', payload)
    const task = data.data
    if (matchesParams(task, params.value)) items.value.push(task)
    touchCounts()
    return task
  }

  /** Optimistically patch a task; rolls back on failure. */
  async function update(id, patch) {
    const current = local(id)
    const snapshot = current ? { ...current } : null
    if (current) Object.assign(current, patch, patch.status ? { completed_at: patch.status === 'done' ? new Date().toISOString() : null } : {})
    try {
      const { data } = await api.patch(`/tasks/${id}`, patch)
      replace(data.data)
      if ('category_id' in patch || 'label_ids' in patch || 'status' in patch) touchCounts()
      return data.data
    } catch (e) {
      if (snapshot) replace(snapshot)
      throw e
    }
  }

  async function toggle(id) {
    const current = local(id)
    const snapshot = current ? { ...current } : null
    if (current) {
      current.status = current.status === 'done' ? 'todo' : 'done'
      current.completed_at = current.status === 'done' ? new Date().toISOString() : null
    }
    try {
      const { data } = await api.patch(`/tasks/${id}/toggle`)
      replace(data.data)
      touchCounts()
      return data.data
    } catch (e) {
      if (snapshot) replace(snapshot)
      throw e
    }
  }

  async function remove(id) {
    const snapshot = [...items.value]
    items.value = items.value.filter((t) => t.id !== id)
    try {
      await api.delete(`/tasks/${id}`)
      touchCounts()
    } catch (e) {
      items.value = snapshot
      throw e
    }
  }

  /**
   * Persist Kanban order. `columns` is `{ todo: Task[], in_progress: Task[], done: Task[] }`
   * in their new order; local tasks are updated before the request.
   */
  async function reorder(columns) {
    const payload = []
    for (const [status, tasks] of Object.entries(columns)) {
      tasks.forEach((task, position) => {
        const item = local(task.id) ?? task
        if (item.status !== status) {
          item.completed_at = status === 'done' ? new Date().toISOString() : null
        }
        item.status = status
        item.position = position
        payload.push({ id: task.id, status, position })
      })
    }
    await api.post('/tasks/reorder', { tasks: payload })
    touchCounts()
  }

  function patchSubtasks(taskId, fn) {
    const task = local(taskId)
    if (!task) return
    task.subtasks = fn(task.subtasks ?? [])
    task.subtasks_count = task.subtasks.length
    task.completed_subtasks_count = task.subtasks.filter((s) => s.is_completed).length
  }

  async function addSubtask(taskId, title) {
    const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title })
    patchSubtasks(taskId, (list) => [...list, data.data])
    return data.data
  }

  async function updateSubtask(taskId, subtaskId, patch) {
    const { data } = await api.patch(`/subtasks/${subtaskId}`, patch)
    patchSubtasks(taskId, (list) => list.map((s) => (s.id === subtaskId ? data.data : s)))
    return data.data
  }

  async function removeSubtask(taskId, subtaskId) {
    await api.delete(`/subtasks/${subtaskId}`)
    patchSubtasks(taskId, (list) => list.filter((s) => s.id !== subtaskId))
  }

  function reset() {
    items.value = []
    meta.value = null
    params.value = {}
  }

  return {
    items,
    meta,
    params,
    loading,
    loadingMore,
    hasMore,
    fetch,
    loadMore,
    search,
    get,
    create,
    update,
    toggle,
    remove,
    reorder,
    addSubtask,
    updateSubtask,
    removeSubtask,
    replace,
    reset,
  }
})
