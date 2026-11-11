import { describe, expect, it } from 'vitest'
import { dayHeading, daysFromToday, dueTone, formatDue, monthGrid, parseDate, quickDates, toISODate } from '../dates'

// Wednesday, 11 November 2026, 10:00 local time
const now = new Date(2026, 10, 11, 10, 0)

describe('dates', () => {
  it('parses API dates as local dates', () => {
    const d = parseDate('2026-11-20')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(20)
    expect(parseDate(null)).toBeNull()
    expect(parseDate('not-a-date')).toBeNull()
  })

  it('formats relative due dates', () => {
    expect(formatDue('2026-11-11', now)).toBe('Today')
    expect(formatDue('2026-11-12', now)).toBe('Tomorrow')
    expect(formatDue('2026-11-10', now)).toBe('Yesterday')
    expect(formatDue('2026-11-14', now)).toBe('Saturday')
    expect(formatDue('2026-12-25', now)).toBe('Dec 25')
    expect(formatDue('2027-01-03', now)).toBe('Jan 3, 2027')
  })

  it('computes the tone of a due chip', () => {
    expect(dueTone('2026-11-01', false, now)).toBe('overdue')
    expect(dueTone('2026-11-01', true, now)).toBe('later')
    expect(dueTone('2026-11-11', false, now)).toBe('today')
    expect(dueTone('2026-11-13', false, now)).toBe('soon')
    expect(dueTone('2026-11-30', false, now)).toBe('later')
    expect(dueTone(null, false, now)).toBe('none')
    expect(daysFromToday('2026-11-18', now)).toBe(7)
  })

  it('builds a Monday-first month grid', () => {
    const grid = monthGrid(now)
    expect(grid.length % 7).toBe(0)
    expect(grid[0].getDay()).toBe(1) // Monday
    expect(toISODate(grid[0])).toBe('2026-10-26')
    expect(toISODate(grid[grid.length - 1])).toBe('2026-12-06')
  })

  it('offers quick dates', () => {
    const [today, tomorrow, nextWeek] = quickDates(now)
    expect(today.value).toBe('2026-11-11')
    expect(tomorrow.value).toBe('2026-11-12')
    expect(nextWeek.value).toBe('2026-11-16') // next Monday
  })

  it('labels upcoming day groups', () => {
    expect(dayHeading('2026-11-12', now)).toBe('Tomorrow · Thu, Nov 12')
    expect(dayHeading('2026-11-20', now)).toBe('Fri, Nov 20')
  })
})
