import { describe, expect, it } from 'vitest'
import type { JiraIssue, SlackMessage, TeamMember } from '../types'
import { applyTeamDisplayNamesToJiraIssues, resolveTeamMembersFromSlack } from './teamIdentity'

const members: TeamMember[] = [
  { id: 'm1', name: 'Freya Vanir', initials: 'FV', role: 'Software Engineer' },
  { id: 'm2', name: 'Leo Herculeus', initials: 'LH', role: 'Software Engineer' },
]

const message: SlackMessage = {
  id: 'C1:1',
  channel: '#platform-team',
  authorId: 'U1',
  authorName: 'Freya V.',
  timestamp: '2026-07-30T10:00:00.000Z',
  text: 'Status update',
  threadId: 'C1:1',
  replyCount: 0,
}

describe('team identity resolution', () => {
  it('uses Slack display names for known team members', () => {
    expect(resolveTeamMembersFromSlack(members, [message])[0]).toMatchObject({
      name: 'Freya V.',
      initials: 'FV',
    })
  })

  it('uses the resolved display name for matching Jira assignees', () => {
    const issue: JiraIssue = {
      id: 'TFP-1',
      title: 'Example',
      status: 'in_progress',
      assigneeId: 'jira-1',
      assigneeName: 'Freya Vanir',
      epic: '',
      updatedDate: '2026-07-30',
    }
    const resolvedMembers = resolveTeamMembersFromSlack(members, [message])
    expect(applyTeamDisplayNamesToJiraIssues([issue], resolvedMembers)[0].assigneeName)
      .toBe('Freya V.')
  })
})
