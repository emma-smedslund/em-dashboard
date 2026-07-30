import type { JiraIssue, SlackMessage, TeamMember } from '../types'

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLocaleLowerCase() ?? ''
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? '')
    .join('')
}

/**
 * Slack display names are authoritative for presentation. Matching by first
 * name is intentionally limited to the small configured demo team; unknown
 * Slack users never overwrite a team member.
 */
export function resolveTeamMembersFromSlack(
  members: TeamMember[],
  messages: SlackMessage[],
): TeamMember[] {
  const slackNamesByFirstName = new Map<string, string>()
  for (const message of messages) {
    if (!message.authorId || !message.authorName.trim()) continue
    const key = firstName(message.authorName)
    if (key) slackNamesByFirstName.set(key, message.authorName.trim())
  }

  return members.map((member) => {
    const slackDisplayName = slackNamesByFirstName.get(firstName(member.name))
    return slackDisplayName
      ? { ...member, name: slackDisplayName, initials: initials(slackDisplayName) }
      : member
  })
}

export function applyTeamDisplayNamesToJiraIssues(
  issues: JiraIssue[],
  members: TeamMember[],
): JiraIssue[] {
  const namesByFirstName = new Map(
    members.map((member) => [firstName(member.name), member.name]),
  )
  return issues.map((issue) => {
    if (!issue.assigneeName) return issue
    const displayName = namesByFirstName.get(firstName(issue.assigneeName))
    return displayName && displayName !== issue.assigneeName
      ? { ...issue, assigneeName: displayName }
      : issue
  })
}
