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

export interface VelocityPoint {
  sprint: string // e.g. "Sprint 24"
  committedPoints: number
  completedPoints: number
}

export interface RiskFlag {
  id: string
  type: 'stale_pr' | 'blocked_ticket' | 'velocity_drop'
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface SprintStatus {
  name: string
  startDate: string
  endDate: string
  totalPoints: number
  completedPoints: number
  velocityHistory: VelocityPoint[]
  risks: RiskFlag[]
}

export interface ActionItem {
  id: string
  memberId: string
  kind: 'one_on_one' | 'follow_up'
  title: string
  dueDate: string // ISO date; status ('overdue' vs 'upcoming') is derived from this, see lib/date.ts
}

export interface AIInsight {
  id: string
  title: string
  summary: string
  rationale: string[] // the evidence bullets, copied verbatim into any action created from this insight
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
}
