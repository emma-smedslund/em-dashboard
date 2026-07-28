// Fixed reference date rather than `new Date()` — the mock data is anchored to
// this date, so relative labels ("overdue by 3 days") stay correct regardless
// of when the portfolio is actually viewed.
export const TODAY = new Date('2026-07-28T00:00:00')

const DAY_MS = 24 * 60 * 60 * 1000

export function daysFromToday(isoDate: string): number {
  const date = new Date(`${isoDate}T00:00:00`)
  return Math.round((date.getTime() - TODAY.getTime()) / DAY_MS)
}

export function formatRelativeDue(isoDate: string): string {
  const diff = daysFromToday(isoDate)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Overdue by 1 day'
  if (diff < 0) return `Overdue by ${Math.abs(diff)} days`
  return `In ${diff} days`
}

export function formatAsOf(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
