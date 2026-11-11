import { addDays } from 'date-fns'
import { toISODate } from './dates'

const PRIORITY_WORDS = { low: 1, medium: 2, med: 2, high: 3, urgent: 4 }

/**
 * Parse the light "natural" syntax of the quick-add input:
 *   - `today`, `tomorrow`      → due date
 *   - `!low` `!medium` `!high` `!urgent` → priority
 *   - `#Category`              → category, matched case-insensitively by name
 *   - `@label`                 → label(s), matched case-insensitively by name
 * Tokens that don't match anything are left in the title.
 */
export function parseQuickAdd(input, { categories = [], labels = [], now = new Date() } = {}) {
  const result = { title: '', due_date: undefined, priority: undefined, category_id: undefined, label_ids: [] }
  const kept = []

  for (const token of String(input).trim().split(/\s+/)) {
    const lower = token.toLowerCase()

    if (lower === 'today') {
      result.due_date = toISODate(now)
      continue
    }
    if (lower === 'tomorrow') {
      result.due_date = toISODate(addDays(now, 1))
      continue
    }
    if (lower.startsWith('!') && PRIORITY_WORDS[lower.slice(1)]) {
      result.priority = PRIORITY_WORDS[lower.slice(1)]
      continue
    }
    if (lower.startsWith('#') && lower.length > 1) {
      const cat = categories.find((c) => c.name.toLowerCase().replace(/\s+/g, '') === lower.slice(1))
      if (cat) {
        result.category_id = cat.id
        continue
      }
    }
    if (lower.startsWith('@') && lower.length > 1) {
      const label = labels.find((l) => l.name.toLowerCase().replace(/\s+/g, '') === lower.slice(1))
      if (label) {
        if (!result.label_ids.includes(label.id)) result.label_ids.push(label.id)
        continue
      }
    }
    kept.push(token)
  }

  result.title = kept.join(' ').trim()
  return result
}
