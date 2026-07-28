// Fixed reference date rather than `new Date()` — the mock data is anchored to
// this date, so relative labels ("overdue by 3 days") stay correct regardless
// of when the portfolio is actually viewed.
export const TODAY = new Date('2026-07-28T00:00:00')

const DAY_MS = 24 * 60 * 60 * 1000

export function daysFromToday(isoDate: string): number {
  const date = new Date(`${isoDate}T00:00:00`)
  return Math.round((date.getTime() - TODAY.getTime()) / DAY_MS)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`)
  const to = new Date(`${toIso}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

export function getActionStatus(isoDate: string): 'overdue' | 'upcoming' {
  return daysFromToday(isoDate) < 0 ? 'overdue' : 'upcoming'
}

export function formatRelativeDue(isoDate: string): string {
  const diff = daysFromToday(isoDate)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Overdue by 1 day'
  if (diff < 0) return `Overdue by ${Math.abs(diff)} days`
  return `In ${diff} days`
}

// Formats using local date parts rather than toISOString(), which converts
// to UTC first and can shift the date by a day in timezones ahead of UTC.
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAsOf(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
