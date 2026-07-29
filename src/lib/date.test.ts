import { describe, expect, it } from 'vitest'
import { daysBetween, daysFromToday, formatRelativeDue, toISODate } from './date'

describe('date helpers', () => {
  const referenceDate = new Date(2026, 6, 29, 18, 30)

  it('calculates dates relative to the supplied local calendar day', () => {
    expect(daysFromToday('2026-07-28', referenceDate)).toBe(-1)
    expect(daysFromToday('2026-07-29', referenceDate)).toBe(0)
    expect(daysFromToday('2026-07-31', referenceDate)).toBe(2)
  })

  it('formats due dates consistently', () => {
    expect(formatRelativeDue('2026-07-28', referenceDate)).toBe('Overdue by 1 day')
    expect(formatRelativeDue('2026-07-30', referenceDate)).toBe('Tomorrow')
    expect(formatRelativeDue('2026-08-02', referenceDate)).toBe('In 4 days')
  })

  it('calculates calendar-day differences and preserves local dates', () => {
    expect(daysBetween('2026-07-15', '2026-07-29')).toBe(14)
    expect(toISODate(referenceDate)).toBe('2026-07-29')
  })
})
