import { describe, expect, it } from 'vitest'
import type { DeliveryGoal, JiraIssue } from '../types'
import {
  getBlockedIssues,
  getCycleTimeStats,
  getGoalHealth,
  getGoalProgress,
  getStaleIssues,
} from './delivery'

const referenceDate = new Date(2026, 6, 29)

function issue(overrides: Partial<JiraIssue> = {}): JiraIssue {
  return {
    id: 'TFP-1',
    title: 'Example issue',
    status: 'in_progress',
    assigneeId: 'user-1',
    epic: '',
    updatedDate: '2026-07-29',
    ...overrides,
  }
}

describe('delivery signals', () => {
  it('keeps blocked issues with unknown duration instead of inventing a date', () => {
    const blocked = getBlockedIssues([
      issue({ id: 'TFP-1', status: 'blocked', blockedSince: '2026-07-24' }),
      issue({ id: 'TFP-2', status: 'blocked', blockedSince: undefined }),
    ], referenceDate)

    expect(blocked.map(({ issue: value, daysBlocked }) => [value.id, daysBlocked])).toEqual([
      ['TFP-1', 5],
      ['TFP-2', null],
    ])
  })

  it('only marks in-progress issues at or beyond the stale threshold', () => {
    const stale = getStaleIssues([
      issue({ id: 'TFP-1', updatedDate: '2026-07-24' }),
      issue({ id: 'TFP-2', updatedDate: '2026-07-25' }),
      issue({ id: 'TFP-3', status: 'done', updatedDate: '2026-07-20' }),
    ], 5, referenceDate)

    expect(stale.map(({ issue: value }) => value.id)).toEqual(['TFP-1'])
  })

  it('compares non-overlapping rolling cycle-time windows', () => {
    const stats = getCycleTimeStats([
      issue({ id: 'TFP-1', status: 'done', startedDate: '2026-07-24', doneDate: '2026-07-28' }),
      issue({ id: 'TFP-2', status: 'done', startedDate: '2026-07-16', doneDate: '2026-07-20' }),
      issue({ id: 'TFP-3', status: 'done', startedDate: '2026-07-06', doneDate: '2026-07-15' }),
      issue({ id: 'TFP-4', status: 'done', startedDate: '2026-06-30', doneDate: '2026-07-01' }),
    ], 14, referenceDate)

    expect(stats).toEqual({ currentMedian: 4, previousMedian: 9, percentChange: -56 })
  })
})

describe('delivery goal health', () => {
  const goal: DeliveryGoal = { text: 'Ship the flow', linkedIssueIds: ['TFP-1', 'TFP-2'] }

  it('reports blocked work before other risk states', () => {
    const progress = getGoalProgress(goal, [
      issue({ id: 'TFP-1', status: 'blocked' }),
      issue({ id: 'TFP-2', status: 'in_progress' }),
    ])

    expect(getGoalHealth(progress, new Set(['TFP-2']))).toMatchObject({ level: 'blocked' })
  })

  it('reports insufficient data when no linked issues can be resolved', () => {
    const progress = getGoalProgress(goal, [])
    expect(getGoalHealth(progress, new Set())).toMatchObject({ level: 'not_enough_data' })
  })
})
