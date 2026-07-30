import { describe, expect, it } from 'vitest'
import {
  apiErrorMessage,
  isJiraIssuesResponse,
  isSlackChannelsResponse,
  isSlackHealthResponse,
  isSlackMessagesResponse,
} from './api'

describe('API response validation', () => {
  it('accepts a complete Jira response and rejects malformed issues', () => {
    const response = {
      projectKey: 'TFP',
      syncedAt: '2026-07-29T18:00:00.000Z',
      issues: [{
        id: 'TFP-2',
        title: 'Connect dashboard',
        status: 'in_progress',
        assigneeId: 'user-1',
        epic: '',
        updatedDate: '2026-07-29',
      }],
    }

    expect(isJiraIssuesResponse(response)).toBe(true)
    expect(isJiraIssuesResponse({ ...response, issues: [{ id: 'TFP-2' }] })).toBe(false)
  })

  it('distinguishes valid Slack success and error responses', () => {
    expect(isSlackHealthResponse({
      connected: true,
      workspaceName: 'Platform Team',
      workspaceId: 'T1',
      botUserId: 'U1',
      checkedAt: '2026-07-29T18:00:00.000Z',
    })).toBe(true)
    expect(isSlackHealthResponse({ connected: false, error: { code: 'slack_error' } })).toBe(false)

    expect(isSlackChannelsResponse({
      channels: [{ id: 'C1', name: 'platform-help', isMember: true }],
      missingChannels: [],
      configuredCount: 1,
      foundCount: 1,
      joinedCount: 1,
      syncedAt: '2026-07-29T18:00:00.000Z',
    })).toBe(true)
  })

  it('extracts safe server errors and falls back for unknown payloads', () => {
    expect(apiErrorMessage({ error: { code: 'jira_error', message: 'Jira unavailable' } }, 'Fallback'))
      .toBe('Jira unavailable')
    expect(apiErrorMessage('<html>', 'Fallback')).toBe('Fallback')
  })

  it('validates normalized Slack message responses', () => {
    expect(isSlackMessagesResponse({
      messages: [{
        id: 'C1:123.456',
        channel: '#platform-team',
        authorName: 'Emma',
        timestamp: '2026-07-29T18:00:00.000Z',
        text: 'Who owns this follow-up?',
        threadId: 'C1:123.456',
        replyCount: 0,
      }],
      windowDays: 14,
      channelCount: 4,
      truncatedChannels: [],
      syncedAt: '2026-07-29T18:01:00.000Z',
    })).toBe(true)
  })
})
