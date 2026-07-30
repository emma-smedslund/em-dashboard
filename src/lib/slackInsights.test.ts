import { describe, expect, it } from 'vitest'
import type { SlackMessage } from '../types'
import { generateSlackInsights } from './slackInsights'

function message(overrides: Partial<SlackMessage>): SlackMessage {
  return {
    id: 'C1:1',
    channel: '#platform-release',
    authorName: 'Freya',
    timestamp: '2026-07-29T10:00:00.000Z',
    text: 'Deploy pipeline timed out',
    threadId: 'C1:1',
    replyCount: 0,
    ...overrides,
  }
}

describe('Slack insight generation', () => {
  it('detects recurring release problems from traceable messages', () => {
    const insights = generateSlackInsights([
      message({ id: 'C1:1' }),
      message({ id: 'C1:2', text: 'Release failed during migration' }),
      message({ id: 'C1:3', text: 'Deployment is stuck again' }),
    ], new Date(2026, 6, 30))

    expect(insights[0]).toMatchObject({
      category: 'recurring_issue',
      confidence: 'medium',
      sources: [{ refId: 'C1:1' }, { refId: 'C1:2' }, { refId: 'C1:3' }],
    })
  })

  it('detects an unanswered question after three days', () => {
    const insights = generateSlackInsights([
      message({
        id: 'C2:1',
        channel: '#platform-team',
        authorName: 'Leo',
        timestamp: '2026-07-26T10:00:00.000Z',
        text: 'Who owns the escalation runbook?',
      }),
    ], new Date(2026, 6, 30))

    expect(insights[0]).toMatchObject({
      category: 'unresolved_question',
      confidence: 'medium',
      sources: [{ refId: 'C2:1' }],
    })
    expect(insights[0].title).toContain('4 days')
  })

  it('does not treat a question with replies as unresolved', () => {
    expect(generateSlackInsights([
      message({
        channel: '#platform-help',
        timestamp: '2026-07-20T10:00:00.000Z',
        text: 'Can someone help?',
        replyCount: 1,
      }),
    ], new Date(2026, 6, 30))).toEqual([])
  })
})
