import { describe, expect, it } from 'vitest'
import type { ActionEntry, SlackMessage } from '../types'
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

function detectRetrospective(actions: ActionEntry[]) {
  return detectTeamSignals({
    jiraIssues: [],
    jiraDataSource: 'live',
    slackMessages: [],
    slackDataSource: 'live',
    pullRequestMetrics: [],
    retrospectiveActions: actions,
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

  it('flags user-entered retrospective actions that remain active for 14 days', () => {
    const actions: ActionEntry[] = [{
      id: 'retro-action-1',
      title: 'Clarify release ownership',
      status: 'active',
      owner: 'Emma',
      dueDate: null,
      priority: 'medium',
      source: 'retrospective',
      context: 'Agreed during the retrospective.',
      createdDate: '2026-07-10',
      decisionDate: '2026-07-10',
      retroDate: '2026-07-10',
      retroTheme: 'Release reliability',
    }]

    expect(detectRetrospective(actions)).toContainEqual(expect.objectContaining({
      id: 'signal-retro-retro-action-1',
      source: 'Retrospective',
      sourceMode: 'user-entered',
    }))
  })

  it('does not flag completed retrospective actions', () => {
    const actions: ActionEntry[] = [{
      id: 'retro-action-2',
      title: 'Document the deployment checklist',
      status: 'completed',
      owner: 'Leo Herculeus',
      dueDate: null,
      priority: 'low',
      source: 'retrospective',
      context: '',
      createdDate: '2026-07-01',
      completedDate: '2026-07-20',
      retroDate: '2026-07-01',
      retroTheme: 'Process',
    }]

    expect(detectRetrospective(actions)).toEqual([])
  })
})
