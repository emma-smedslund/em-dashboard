import type { JiraIssue, TeamMember, DeliveryGoal } from '../types'
import { DEMO_REFERENCE_DATE, toISODate, daysBetween } from './date'

const HIGH_WIP_THRESHOLD = 3

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export interface BlockedIssueView {
  issue: JiraIssue
  daysBlocked: number | null
}

export function getBlockedIssues(
  issues: JiraIssue[],
  referenceDate = DEMO_REFERENCE_DATE,
): BlockedIssueView[] {
  return issues
    .filter((issue) => issue.status === 'blocked')
    .map((issue) => ({
      issue,
      daysBlocked: issue.blockedSince
        ? daysBetween(issue.blockedSince, toISODate(referenceDate))
        : null,
    }))
    .sort((a, b) => (b.daysBlocked ?? -1) - (a.daysBlocked ?? -1))
}

export function getStaleIssues(
  issues: JiraIssue[],
  thresholdDays: number,
  referenceDate = DEMO_REFERENCE_DATE,
): Array<{ issue: JiraIssue; daysStale: number }> {
  return issues
    .filter((i) => i.status === 'in_progress')
    .map((issue) => ({ issue, daysStale: daysBetween(issue.updatedDate, toISODate(referenceDate)) }))
    .filter((value) => value.daysStale >= thresholdDays)
    .sort((a, b) => b.daysStale - a.daysStale)
}

export interface HighWipView {
  assigneeId: string
  name: string
  count: number
}

export function getHighWipDevelopers(
  issues: JiraIssue[],
  members: TeamMember[],
  threshold = HIGH_WIP_THRESHOLD,
): HighWipView[] {
  const counts = new Map<string, number>()
  for (const issue of issues) {
    if (issue.status !== 'in_progress') continue
    counts.set(issue.assigneeId, (counts.get(issue.assigneeId) ?? 0) + 1)
  }

  const names = new Map(members.map((member) => [member.id, member.name]))
  for (const issue of issues) {
    if (issue.assigneeName) names.set(issue.assigneeId, issue.assigneeName)
  }

  return [...counts.entries()]
    .map(([assigneeId, count]) => ({
      assigneeId,
      name: names.get(assigneeId) ?? 'Unassigned',
      count,
    }))
    .filter((v) => v.count > threshold)
    .sort((a, b) => b.count - a.count)
}

export interface CycleTimeStats {
  currentMedian: number
  previousMedian: number
  percentChange: number
}

// Rolling-window comparison (current window vs the one before it) rather
// than sprint boundaries — works the same for scrum, scrumban, and kanban
// teams. windowDays is a parameter so it can become user-configurable later.
export function getCycleTimeStats(
  issues: JiraIssue[],
  windowDays: number,
  referenceDate = DEMO_REFERENCE_DATE,
): CycleTimeStats | null {
  const done = issues.filter(
    (i): i is JiraIssue & { startedDate: string; doneDate: string } =>
      i.status === 'done' && !!i.startedDate && !!i.doneDate,
  )

  const currentWindow: number[] = []
  const previousWindow: number[] = []

  for (const issue of done) {
    const daysAgo = daysBetween(issue.doneDate, toISODate(referenceDate))
    const cycleTime = daysBetween(issue.startedDate, issue.doneDate)
    if (daysAgo >= 0 && daysAgo < windowDays) currentWindow.push(cycleTime)
    else if (daysAgo >= windowDays && daysAgo < windowDays * 2) previousWindow.push(cycleTime)
  }

  if (currentWindow.length === 0 || previousWindow.length === 0) return null

  const currentMedian = median(currentWindow)
  const previousMedian = median(previousWindow)
  const percentChange =
    previousMedian === 0 ? 0 : Math.round(((currentMedian - previousMedian) / previousMedian) * 100)

  return { currentMedian, previousMedian, percentChange }
}

export interface GoalProgressItem {
  issue: JiraIssue
  done: boolean
}

export interface GoalProgress {
  items: GoalProgressItem[]
  doneCount: number
  totalCount: number
  percent: number
}

export function getGoalProgress(goal: DeliveryGoal, issues: JiraIssue[]): GoalProgress {
  const items = goal.linkedIssueIds
    .map((id) => issues.find((i) => i.id === id))
    .filter((i): i is JiraIssue => !!i)
    .map((issue) => ({ issue, done: issue.status === 'done' }))

  const doneCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  return { items, doneCount, totalCount, percent }
}

export type GoalHealthLevel = 'completed' | 'blocked' | 'at_risk' | 'on_track' | 'not_enough_data'

export interface GoalHealth {
  level: GoalHealthLevel
  label: string
  explanation: string
}

export function getGoalHealth(
  progress: GoalProgress,
  staleIssueIds: Set<string>,
): GoalHealth {
  if (progress.totalCount === 0) {
    return {
      level: 'not_enough_data',
      label: 'Not enough data',
      explanation: 'Link Jira issues to assess delivery health.',
    }
  }
  if (progress.doneCount === progress.totalCount) {
    return {
      level: 'completed',
      label: 'Completed',
      explanation: 'All linked issues are complete.',
    }
  }

  const blockedCount = progress.items.filter(({ issue }) => issue.status === 'blocked').length
  if (blockedCount > 0) {
    return {
      level: 'blocked',
      label: 'Blocked',
      explanation: `${blockedCount} linked ${blockedCount === 1 ? 'issue is' : 'issues are'} blocked.`,
    }
  }

  const staleCount = progress.items.filter(({ issue }) => staleIssueIds.has(issue.id)).length
  if (staleCount > 0) {
    return {
      level: 'at_risk',
      label: 'At risk',
      explanation: `${staleCount} unfinished ${staleCount === 1 ? 'issue has' : 'issues have'} had no activity for at least 5 days.`,
    }
  }

  const startedCount = progress.items.filter(({ issue }) => issue.status !== 'todo').length
  if (startedCount === 0 && progress.totalCount > 1) {
    return {
      level: 'at_risk',
      label: 'At risk',
      explanation: `None of the ${progress.totalCount} linked issues has started.`,
    }
  }

  return {
    level: 'on_track',
    label: 'On track',
    explanation: `${progress.totalCount - progress.doneCount} linked ${progress.totalCount - progress.doneCount === 1 ? 'issue remains' : 'issues remain'}, with no blockers or stale work.`,
  }
}
