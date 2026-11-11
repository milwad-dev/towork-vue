import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCheckbox from '../tasks/TaskCheckbox.vue'
import DueChip from '../tasks/DueChip.vue'

describe('TaskCheckbox', () => {
  it('exposes checkbox semantics and emits toggle', async () => {
    const wrapper = mount(TaskCheckbox, { props: { checked: false, priority: 4 } })
    const button = wrapper.get('[role="checkbox"]')
    expect(button.attributes('aria-checked')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Mark as complete')
    expect(button.classes()).toContain('border-red-500') // urgent ring
    await button.trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('renders the checked state', () => {
    const wrapper = mount(TaskCheckbox, { props: { checked: true } })
    expect(wrapper.get('[role="checkbox"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[role="checkbox"]').attributes('aria-label')).toBe('Mark as not done')
  })
})

describe('DueChip', () => {
  it('marks overdue dates for screen readers', () => {
    const wrapper = mount(DueChip, { props: { date: '2000-01-01' } })
    expect(wrapper.text()).toContain('(overdue)')
    expect(wrapper.classes()).toContain('text-red-600')
  })

  it('renders nothing without a date', () => {
    const wrapper = mount(DueChip, { props: { date: null } })
    expect(wrapper.text()).toBe('')
  })
})
