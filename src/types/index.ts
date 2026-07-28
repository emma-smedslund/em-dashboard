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
  dueDate: string // ISO date
  status: 'upcoming' | 'overdue' | 'done'
}
