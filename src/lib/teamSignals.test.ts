import { describe, expect, it } from 'vitest'
import type { SlackMessage } from '../types'
import { detectTeamSignals } from './teamSignals'

function slackMessage(overrides: Partial<SlackMessage>): SlackMessage {
  return {
    id: 'C1:1',
    channel: '#platform-team',
    authorName: 'Leo Herculeus',
    timestamp: '2026-07-25T10:00:00.000Z',
    text: 'Who owns the escalation runbook?',
    threadId: 'C1:1',
    replyCount: 0,
    url: '/api/slack/permalink?channel=C1&message_ts=1.0',
    ...overrides,
  }
}

function detect(slackMessages: SlackMessage[]) {
  return detectTeamSignals({
    jiraIssues: [],
    jiraDataSource: 'live',
    slackMessages,
    slackDataSource: 'live',
    pullRequestMetrics: [],
    retrospectiveActions: [],
    referenceDate: new Date(2026, 6, 30),
  })
}

describe('team signal interpretation', () => {
  it('keeps confidence, source mode, and traceable Slack evidence', () => {
    const [signal] = detect([slackMessage({})])

    expect(signal).toMatchObject({
      confidence: 'high',
      source: 'Slack',
      sourceMode: 'live',
      evidence: [{ refId: 'C1:1' }],
    })
  })

  it('does not flag answered questions', () => {
    expect(detect([slackMessage({ replyCount: 2 })])).toEqual([])
  })
})
