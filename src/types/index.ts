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
  authorId?: string // stable Slack user or bot id when using live data
  authorName: string
  timestamp: string // ISO datetime
  text: string
  threadId: string
  replyCount: number
  url?: string // server-side redirect to the original Slack message
}

export type SlackDataSource = 'live' | 'demo'

export type ActionStatus = 'suggested' | 'active' | 'completed' | 'dismissed'
export type ActionPriority = 'low' | 'medium' | 'high'
export type ActionSource = 'ai' | 'signal' | 'manual' | 'retrospective'

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
  sourceDataMode?: 'live' | 'demo' | 'user-entered'
  decisionDate?: string
  retroDate?: string
  retroTheme?: string
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
  confidence: 'low' | 'medium' | 'high'
  source: TeamSignalSource
  sourceMode: 'live' | 'demo' | 'user-entered'
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
