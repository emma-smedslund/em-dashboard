import type { AIInsight, JiraIssue } from '../types'
import { daysBetween, toISODate } from './date'

const STALE_DAYS = 5
const HIGH_WIP_THRESHOLD = 3
const MAX_JIRA_INSIGHTS = 4

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm
}

function stableId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function blockedDuration(days: number) {
  return days === 0 ? 'blocked today' : `blocked for ${days} ${plural(days, 'day')}`
}

function blockedDurationForIssue(issue: JiraIssue, today: string): string {
  return issue.blockedSince
    ? blockedDuration(daysBetween(issue.blockedSince, today))
    : 'blocked; duration unavailable'
}

function issueEvidence(issue: JiraIssue, detail: string) {
  return {
    type: 'jira' as const,
    refId: issue.id,
    label: `${issue.id} “${issue.title}” — ${detail}`,
  }
}

/**
 * Frontend-only MVP correlation rules. The output follows the same AIInsight
 * contract a future server-side AI pipeline can return, while every conclusion
 * remains deterministic and traceable to the Jira records that triggered it.
 */
export function generateJiraInsights(issues: JiraIssue[], referenceDate = new Date()): AIInsight[] {
  const today = toISODate(referenceDate)
  const insights: AIInsight[] = []
  const blocked = issues.filter((issue) => issue.status === 'blocked')
  const groupedIssueIds = new Set<string>()

  const dependencyGroups = new Map<string, JiraIssue[]>()
  for (const issue of blocked) {
    const dependency = issue.blockedReason?.trim()
    if (!dependency) continue
    const group = dependencyGroups.get(dependency) ?? []
    group.push(issue)
    dependencyGroups.set(dependency, group)
  }

  for (const [dependency, group] of [...dependencyGroups].sort((a, b) => b[1].length - a[1].length)) {
    if (group.length < 2) continue
    group.forEach((issue) => groupedIssueIds.add(issue.id))
    const knownDurations = group.flatMap((issue) =>
      issue.blockedSince ? [daysBetween(issue.blockedSince, today)] : [],
    )
    const durationSummary = knownDurations.length > 0
      ? ` The oldest confirmed blocker has been blocked for ${Math.max(...knownDurations)} ${plural(Math.max(...knownDurations), 'day')}.`
      : ' Jira does not provide a reliable blocked-since date for these issues.'
    const keys = group.map((issue) => issue.id).join(', ')
    insights.push({
      id: `jira-shared-dependency-${stableId(dependency)}`,
      category: 'delivery_risk',
      title: `${group.length} Jira issues are blocked by the same dependency`,
      summary: `${keys} are all waiting on the same dependency.${durationSummary}`,
      sources: group.map((issue) =>
        issueEvidence(
          issue,
          `${blockedDurationForIssue(issue, today)}: ${dependency}`,
        ),
      ),
      confidence: group.length >= 3 ? 'high' : 'medium',
      recommendedAction: `Clarify ownership and escalate the shared dependency affecting ${keys}`,
      status: 'new',
    })
  }

  const longestBlocked = blocked
    .filter((issue) => !groupedIssueIds.has(issue.id))
    .map((issue) => ({
      issue,
      days: issue.blockedSince ? daysBetween(issue.blockedSince, today) : null,
    }))
    .sort((a, b) => (b.days ?? -1) - (a.days ?? -1))[0]

  if (longestBlocked) {
    const { issue, days } = longestBlocked
    insights.push({
      id: `jira-blocked-${issue.id.toLowerCase()}`,
      category: 'delivery_risk',
      title: `${issue.id} is ${days === null ? 'blocked' : blockedDuration(days)}`,
      summary: `${issue.title} is still blocked${issue.blockedReason ? `: ${issue.blockedReason}` : ''}.`,
      sources: [issueEvidence(issue, `${issue.blockedReason ?? 'Blocked in Jira'} · ${days === null ? 'duration unavailable' : blockedDuration(days)}`)],
      confidence: days !== null && days >= 5 ? 'high' : 'medium',
      recommendedAction: `Confirm the unblock owner and next step for ${issue.id}`,
      status: 'new',
    })
  }

  const stale = issues
    .filter((issue) => issue.status === 'in_progress')
    .map((issue) => ({ issue, days: daysBetween(issue.updatedDate, today) }))
    .filter(({ days }) => days >= STALE_DAYS)
    .sort((a, b) => b.days - a.days)

  if (stale.length > 0) {
    const evidence = stale.slice(0, 5)
    insights.push({
      id: `jira-stale-${evidence.map(({ issue }) => issue.id.toLowerCase()).join('-')}`,
      category: 'delivery_risk',
      title: `${stale.length} in-progress ${plural(stale.length, 'issue')} may have gone stale`,
      summary: `${stale.length} ${plural(stale.length, 'issue')} ${stale.length === 1 ? 'has' : 'have'} had no Jira activity for at least ${STALE_DAYS} days.`,
      sources: evidence.map(({ issue, days }) => issueEvidence(issue, `no activity for ${days} days`)),
      confidence: stale.length >= 3 ? 'high' : 'medium',
      recommendedAction: 'Review stale in-progress work and decide whether to unblock, reassign, or stop it',
      status: 'new',
    })
  }

  const wipByAssignee = new Map<string, JiraIssue[]>()
  for (const issue of issues) {
    if (issue.status !== 'in_progress' || issue.assigneeId === 'unassigned') continue
    const assigned = wipByAssignee.get(issue.assigneeId) ?? []
    assigned.push(issue)
    wipByAssignee.set(issue.assigneeId, assigned)
  }
  const highestWip = [...wipByAssignee.values()]
    .filter((assigned) => assigned.length > HIGH_WIP_THRESHOLD)
    .sort((a, b) => b.length - a.length)[0]

  if (highestWip) {
    const owner = highestWip[0].assigneeName ?? 'One team member'
    insights.push({
      id: `jira-high-wip-${stableId(highestWip[0].assigneeId)}`,
      category: 'possible_overload',
      title: `${owner} has high work in progress`,
      summary: `${owner} currently owns ${highestWip.length} Jira issues in progress, above the flow-health threshold of ${HIGH_WIP_THRESHOLD}.`,
      sources: highestWip.map((issue) => issueEvidence(issue, 'currently in progress')),
      confidence: highestWip.length >= 5 ? 'high' : 'medium',
      recommendedAction: `Review ${owner}’s active work and reduce parallel work where possible`,
      status: 'new',
    })
  }

  return insights.slice(0, MAX_JIRA_INSIGHTS)
}
