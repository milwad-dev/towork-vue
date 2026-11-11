import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { api } from '@/lib/api'
import { matchesParams, toQuery, useTasksStore } from '../tasks'

const task = (over = {}) => ({
  id: 1,
  title: 'Write tests',
  description: null,
  status: 'todo',
  priority: 2,
  due_date: '2026-11-11',
  category_id: null,
  labels: [],
  subtasks: [],
  subtasks_count: 0,
  completed_subtasks_count: 0,
  position: 0,
  ...over,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  api.get.mockResolvedValue({ data: { data: [] } })
})

describe('toQuery', () => {
  it('joins arrays and drops empty values', () => {
    expect(toQuery({ status: ['todo', 'done'], priority: [], search: '', sort: 'title', page: 0 })).toEqual({
      status: 'todo,done',
      sort: 'title',
      page: 0,
    })
  })
})

describe('matchesParams', () => {
  const today = '2026-11-11'
  it('mirrors API filters', () => {
    expect(matchesParams(task(), { status: ['todo', 'in_progress'], date_to: today }, today)).toBe(true)
    expect(matchesParams(task({ status: 'done' }), { status: ['todo'] }, today)).toBe(false)
    expect(matchesParams(task({ due_date: '2026-11-12' }), { due: 'upcoming' }, today)).toBe(true)
    expect(matchesParams(task({ due_date: '2026-11-01' }), { due: 'overdue' }, today)).toBe(true)
    expect(matchesParams(task({ due_date: null }), { due: 'none' }, today)).toBe(true)
    expect(matchesParams(task({ category_id: 3 }), { category_id: 'none' }, today)).toBe(false)
    expect(matchesParams(task({ labels: [{ id: 5 }] }), { label_id: '5' }, today)).toBe(true)
    expect(matchesParams(task(), { search: 'TESTS' }, today)).toBe(true)
    expect(matchesParams(task(), { priority: [3, 4] }, today)).toBe(false)
  })
})

describe('tasks store', () => {
  it('fetches tasks with serialized params', async () => {
    api.get.mockResolvedValue({ data: { data: [task()], meta: { current_page: 1, last_page: 2 } } })
    const store = useTasksStore()
    await store.fetch({ status: ['todo'], sort: 'due_date' })
    expect(api.get).toHaveBeenCalledWith('/tasks', { params: { status: 'todo', sort: 'due_date' } })
    expect(store.items).toHaveLength(1)
    expect(store.hasMore).toBe(true)
  })

  it('toggles optimistically and rolls back on failure', async () => {
    const store = useTasksStore()
    store.items = [task()]
    let reject
    api.patch.mockReturnValue(new Promise((_, r) => (reject = r)))
    const pending = store.toggle(1)
    expect(store.items[0].status).toBe('done')
    reject(new Error('offline'))
    await expect(pending).rejects.toThrow('offline')
    expect(store.items[0].status).toBe('todo')
  })

  it('only inserts created tasks that match the current view', async () => {
    const store = useTasksStore()
    await store.fetch({ category_id: 2 })
    api.post.mockResolvedValueOnce({ data: { data: task({ id: 2, category_id: 2 }) } })
    api.post.mockResolvedValueOnce({ data: { data: task({ id: 3, category_id: 9 }) } })
    await store.create({ title: 'a' })
    await store.create({ title: 'b' })
    expect(store.items.map((t) => t.id)).toEqual([2])
  })

  it('sends every task of the affected columns when reordering', async () => {
    const store = useTasksStore()
    const a = task({ id: 1 })
    const b = task({ id: 2, status: 'in_progress' })
    store.items = [a, b]
    api.post.mockResolvedValue({})
    await store.reorder({ todo: [], in_progress: [store.items[1], store.items[0]], done: [] })
    expect(api.post).toHaveBeenCalledWith('/tasks/reorder', {
      tasks: [
        { id: 2, status: 'in_progress', position: 0 },
        { id: 1, status: 'in_progress', position: 1 },
      ],
    })
    expect(store.items[0].status).toBe('in_progress')
  })

  it('keeps subtask counts in sync', async () => {
    const store = useTasksStore()
    store.items = [task()]
    api.post.mockResolvedValue({ data: { data: { id: 9, title: 'Sub', is_completed: false } } })
    await store.addSubtask(1, 'Sub')
    api.patch.mockResolvedValue({ data: { data: { id: 9, title: 'Sub', is_completed: true } } })
    await store.updateSubtask(1, 9, { is_completed: true })
    expect(store.items[0].subtasks_count).toBe(1)
    expect(store.items[0].completed_subtasks_count).toBe(1)
  })
})
