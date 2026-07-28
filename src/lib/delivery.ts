import type { JiraIssue, TeamMember, DeliveryGoal } from '../types'
import { TODAY, toISODate, daysBetween } from './date'

const HIGH_WIP_THRESHOLD = 3

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export interface BlockedIssueView {
  issue: JiraIssue
  daysBlocked: number
}

export function getBlockedIssues(issues: JiraIssue[]): BlockedIssueView[] {
  return issues
    .filter((i): i is JiraIssue & { blockedSince: string } => i.status === 'blocked' && !!i.blockedSince)
    .map((issue) => ({ issue, daysBlocked: daysBetween(issue.blockedSince, toISODate(TODAY)) }))
    .sort((a, b) => b.daysBlocked - a.daysBlocked)
}

export function getStaleIssues(issues: JiraIssue[], thresholdDays: number): BlockedIssueView[] {
  return issues
    .filter((i) => i.status === 'in_progress')
    .map((issue) => ({ issue, daysBlocked: daysBetween(issue.updatedDate, toISODate(TODAY)) }))
    .filter((v) => v.daysBlocked > thresholdDays)
    .sort((a, b) => b.daysBlocked - a.daysBlocked)
}

export interface HighWipView {
  member: TeamMember
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

  return members
    .map((member) => ({ member, count: counts.get(member.id) ?? 0 }))
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
export function getCycleTimeStats(issues: JiraIssue[], windowDays: number): CycleTimeStats | null {
  const done = issues.filter(
    (i): i is JiraIssue & { startedDate: string; doneDate: string } =>
      i.status === 'done' && !!i.startedDate && !!i.doneDate,
  )

  const currentWindow: number[] = []
  const previousWindow: number[] = []

  for (const issue of done) {
    const daysAgo = daysBetween(issue.doneDate, toISODate(TODAY))
    const cycleTime = daysBetween(issue.startedDate, issue.doneDate)
    if (daysAgo <= windowDays) currentWindow.push(cycleTime)
    else if (daysAgo <= windowDays * 2) previousWindow.push(cycleTime)
  }

  if (currentWindow.length === 0 || previousWindow.length === 0) return null

  const currentMedian = median(currentWindow)
  const previousMedian = median(previousWindow)
  const percentChange =
    previousMedian === 0 ? 0 : Math.round(((currentMedian - previousMedian) / previousMedian) * 100)

  return { currentMedian, previousMedian, percentChange }
}

export interface GoalProgressItem {
  id: string
  title: string
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
    .map((issue) => ({ id: issue.id, title: issue.title, done: issue.status === 'done' }))

  const doneCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  return { items, doneCount, totalCount, percent }
}
