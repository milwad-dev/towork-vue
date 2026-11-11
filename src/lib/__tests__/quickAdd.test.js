import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from '../quickAdd'

const now = new Date(2026, 10, 11, 9)
const categories = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Side Project' },
]
const labels = [
  { id: 7, name: 'phone' },
  { id: 8, name: 'errand' },
]

describe('parseQuickAdd', () => {
  it('extracts date, priority, category and labels', () => {
    const r = parseQuickAdd('Call Sam tomorrow !high #work @phone', { categories, labels, now })
    expect(r).toEqual({ title: 'Call Sam', due_date: '2026-11-12', priority: 3, category_id: 1, label_ids: [7] })
  })

  it('matches multi-word category names without spaces', () => {
    expect(parseQuickAdd('Ship it #sideproject', { categories, now }).category_id).toBe(2)
  })

  it('leaves unknown tokens in the title', () => {
    const r = parseQuickAdd('Fix #42 email @nobody !soon', { categories, labels, now })
    expect(r.title).toBe('Fix #42 email @nobody !soon')
    expect(r.category_id).toBeUndefined()
    expect(r.priority).toBeUndefined()
    expect(r.label_ids).toEqual([])
  })

  it('handles today and de-duplicates labels', () => {
    const r = parseQuickAdd('today Buy milk @errand @errand !urgent', { labels, now })
    expect(r.title).toBe('Buy milk')
    expect(r.due_date).toBe('2026-11-11')
    expect(r.priority).toBe(4)
    expect(r.label_ids).toEqual([8])
  })
})
