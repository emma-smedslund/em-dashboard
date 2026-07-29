export interface TeamMember {
  id: string
  name: string
  initials: string
  role: string
}

export interface HealthEntry {
  memberId: string
  week: string // ISO date, e.g. "2026-07-07"
  sentiment: number // 1-5, self-reported
  workload: number // 1-5, 5 = overloaded
}

export interface ActionItem {
  id: string
  memberId: string
  kind: 'one_on_one' | 'follow_up'
  title: string
  dueDate: string // ISO date; status ('overdue' vs 'upcoming') is derived from this, see lib/date.ts
}

// Simulated signal sources. These stand in for real Jira/Slack integrations
// until a live connection is wired up.
export interface JiraIssue {
  id: string // e.g. 'ENG-1190'
  title: string
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  statusName?: string // exact Jira workflow status, e.g. "In Review"
  assigneeId: string
  assigneeName?: string // populated by live Jira; demo data resolves names via teamMembers
  epic: string
  url?: string // direct link back to the Jira issue when using live data
  updatedDate: string // ISO date; last activity, used to detect stale tickets
  blockedReason?: string
  blockedSince?: string // ISO date; present only while status === 'blocked'
  crossTeamDependency?: string // name of the other team this issue is blocked on, if any
  startedDate?: string // ISO date; when work began, used for cycle time
  doneDate?: string // ISO date; when the issue was completed, used for cycle time
}

export type JiraDataSource = 'live' | 'demo'

export interface JiraIssuesResponse {
  issues: JiraIssue[]
  projectKey: string
  syncedAt: string
}

// A goal the EM is tracking for the current delivery window, with progress
// measured by explicitly linked issues rather than story points.
export interface DeliveryGoal {
  text: string
  linkedIssueIds: string[]
}

export interface SlackMessage {
  id: string
  channel: string
  authorName: string
  timestamp: string // ISO datetime
  text: string
  threadId: string
  replyCount: number
}

export interface InitiativeLoadPoint {
  sprint: string
  activeInitiatives: number
}

export type InsightCategory =
  | 'delivery_risk'
  | 'recurring_issue'
  | 'unresolved_question'
  | 'possible_overload'

export type SignalSourceType = 'jira' | 'slack' | 'health' | 'delivery'

export interface InsightSource {
  type: SignalSourceType
  label: string // human-readable evidence line, always shown
  // Links to a concrete record when present: JiraIssue.id, SlackMessage.id,
  // or "<memberId>:<week>" for a HealthEntry. Omitted for aggregate/
  // statistical evidence (e.g. a velocity trend) that has no single record.
  refId?: string
}

export interface AIInsight {
  id: string
  title: string
  summary: string
  category: InsightCategory
  sources: InsightSource[] // the evidence, each pointing at a source signal
  confidence: 'low' | 'medium' | 'high'
  recommendedAction: string
  status: 'new' | 'accepted' | 'dismissed'
}

export type ActionStatus = 'suggested' | 'active' | 'completed' | 'dismissed'
export type ActionPriority = 'low' | 'medium' | 'high'
export type ActionSource = 'ai' | 'manual'

export interface ActionEntry {
  id: string
  title: string
  status: ActionStatus
  owner: string | null // team member name, or null if unassigned
  dueDate: string | null // ISO date; null if no due date is set
  priority: ActionPriority
  source: ActionSource
  context: string // short, one-line reason this action exists
  createdDate: string // ISO date
  completedDate?: string // ISO date; set when marked complete
  sourceInsightId?: string // present only for actions suggested from an AI Insight
  sourceInsightTitle?: string // copied from the insight at creation time so this doesn't depend on the insights list
  sourceEvidence?: string[] // rationale bullets carried over from the insight
  linkedJiraIssueIds?: string[] // live Jira references; Jira status remains read-only in this app
}
