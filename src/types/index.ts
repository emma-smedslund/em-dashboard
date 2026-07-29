export interface TeamMember {
  id: string
  name: string
  initials: string
  role: string
}

// Simulated signal sources. These stand in for real Jira/Slack integrations
// until a live connection is wired up.
export interface JiraIssue {
  id: string // e.g. 'TFP-2'
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

export type InsightCategory =
  | 'delivery_risk'
  | 'recurring_issue'
  | 'unresolved_question'
  | 'possible_overload'

export type SignalSourceType = 'jira' | 'slack' | 'delivery'

export interface InsightSource {
  type: SignalSourceType
  label: string // human-readable evidence line, always shown
  // Links to a concrete record when present: JiraIssue.id or SlackMessage.id.
  // Omitted for aggregate/
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
export type ActionSource = 'ai' | 'signal' | 'manual'

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
  sourceSignalId?: string
  sourceSignalTitle?: string
}

export const TEAM_SIGNAL_CATEGORIES = [
  'Delivery',
  'Maintenance',
  'Quality',
  'Collaboration',
  'Availability',
  'Improvement',
  'Retrospective',
] as const
export type TeamSignalCategory = (typeof TEAM_SIGNAL_CATEGORIES)[number]

export const TEAM_SIGNAL_SEVERITIES = ['Info', 'Watch', 'Attention'] as const
export type TeamSignalSeverity = (typeof TEAM_SIGNAL_SEVERITIES)[number]

export const TEAM_SIGNAL_STATUSES = ['New', 'Acknowledged', 'Monitoring', 'Resolved'] as const
export type TeamSignalStatus = (typeof TEAM_SIGNAL_STATUSES)[number]

export const TEAM_SIGNAL_SOURCES = ['Jira', 'Slack', 'GitHub', 'Retrospective'] as const
export type TeamSignalSource = (typeof TEAM_SIGNAL_SOURCES)[number]

export interface TeamSignalEvidence {
  label: string
  refId?: string
}

export interface TeamSignal {
  id: string
  title: string
  summary: string
  category: TeamSignalCategory
  severity: TeamSignalSeverity
  source: TeamSignalSource
  sourceMode: 'live' | 'demo'
  detectedAt: string
  timeRange: string
  evidence: TeamSignalEvidence[]
  suggestedFollowUp?: string
  status: TeamSignalStatus
}

export interface PullRequestPeriodMetric {
  period: 'current' | 'previous'
  medianReviewHours: number
  topTwoReviewerShare: number
}

export interface RetrospectiveActionPoint {
  id: string
  title: string
  theme: string
  status: 'open' | 'resolved'
  createdDate: string
  updatedDate: string
}
