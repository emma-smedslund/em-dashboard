import { describe, expect, it } from 'vitest'
import type { JiraIssue } from '../types'
import { generateJiraInsights } from './jiraInsights'

function blockedIssue(id: string, blockedSince?: string): JiraIssue {
  return {
    id,
    title: `Issue ${id}`,
    status: 'blocked',
    assigneeId: 'user-1',
    assigneeName: 'Freya',
    epic: '',
    updatedDate: '2026-07-29',
    blockedReason: 'Blocked by PAY-1 — Payments API contract',
    blockedSince,
  }
}

describe('Jira insight generation', () => {
  it('groups shared dependencies and keeps evidence traceable', () => {
    const insights = generateJiraInsights([
      blockedIssue('TFP-1', '2026-07-24'),
      blockedIssue('TFP-2', '2026-07-26'),
    ], new Date(2026, 6, 29))

    expect(insights).toHaveLength(1)
    expect(insights[0]).toMatchObject({
      category: 'delivery_risk',
      confidence: 'medium',
      sources: [
        { type: 'jira', refId: 'TFP-1' },
        { type: 'jira', refId: 'TFP-2' },
      ],
    })
    expect(insights[0].summary).toContain('oldest confirmed blocker has been blocked for 5 days')
  })

  it('states when Jira cannot provide a blocked-since date', () => {
    const [insight] = generateJiraInsights([blockedIssue('TFP-3')], new Date(2026, 6, 29))

    expect(insight.title).toBe('TFP-3 is blocked')
    expect(insight.sources[0].label).toContain('duration unavailable')
  })
})
