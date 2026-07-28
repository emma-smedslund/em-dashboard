import type {
  TeamMember,
  HealthEntry,
  SprintStatus,
  ActionItem,
} from '../types'

export const teamMembers: TeamMember[] = [
  { id: 'm1', name: 'Priya Nair', initials: 'PN', role: 'Senior Engineer' },
  { id: 'm2', name: 'Daniel Osei', initials: 'DO', role: 'Engineer' },
  { id: 'm3', name: 'Wei Zhang', initials: 'WZ', role: 'Engineer' },
  { id: 'm4', name: 'Sofia Ramirez', initials: 'SR', role: 'Senior Engineer' },
  { id: 'm5', name: 'Jonas Berg', initials: 'JB', role: 'Engineer (new hire)' },
]

export const healthEntries: HealthEntry[] = [
  // Priya - steady, high performer
  { memberId: 'm1', week: '2026-06-29', sentiment: 4, workload: 3 },
  { memberId: 'm1', week: '2026-07-06', sentiment: 4, workload: 3 },
  { memberId: 'm1', week: '2026-07-13', sentiment: 4, workload: 4 },
  { memberId: 'm1', week: '2026-07-20', sentiment: 3, workload: 4 },

  // Daniel - trending down, workload creeping up
  { memberId: 'm2', week: '2026-06-29', sentiment: 4, workload: 3 },
  { memberId: 'm2', week: '2026-07-06', sentiment: 3, workload: 4 },
  { memberId: 'm2', week: '2026-07-13', sentiment: 3, workload: 4 },
  { memberId: 'm2', week: '2026-07-20', sentiment: 2, workload: 5 },

  // Wei - stable and content
  { memberId: 'm3', week: '2026-06-29', sentiment: 4, workload: 3 },
  { memberId: 'm3', week: '2026-07-06', sentiment: 4, workload: 3 },
  { memberId: 'm3', week: '2026-07-13', sentiment: 5, workload: 2 },
  { memberId: 'm3', week: '2026-07-20', sentiment: 4, workload: 3 },

  // Sofia - recovering after a rough patch
  { memberId: 'm4', week: '2026-06-29', sentiment: 2, workload: 5 },
  { memberId: 'm4', week: '2026-07-06', sentiment: 3, workload: 4 },
  { memberId: 'm4', week: '2026-07-13', sentiment: 3, workload: 3 },
  { memberId: 'm4', week: '2026-07-20', sentiment: 4, workload: 3 },

  // Jonas - new hire, ramping
  { memberId: 'm5', week: '2026-06-29', sentiment: 3, workload: 2 },
  { memberId: 'm5', week: '2026-07-06', sentiment: 3, workload: 3 },
  { memberId: 'm5', week: '2026-07-13', sentiment: 4, workload: 3 },
  { memberId: 'm5', week: '2026-07-20', sentiment: 4, workload: 3 },
]

export const sprintStatus: SprintStatus = {
  name: 'Sprint 24',
  startDate: '2026-07-21',
  endDate: '2026-08-01',
  totalPoints: 42,
  completedPoints: 18,
  velocityHistory: [
    { sprint: 'Sprint 21', committedPoints: 38, completedPoints: 36 },
    { sprint: 'Sprint 22', committedPoints: 40, completedPoints: 39 },
    { sprint: 'Sprint 23', committedPoints: 41, completedPoints: 33 },
    { sprint: 'Sprint 24', committedPoints: 42, completedPoints: 18 },
  ],
  risks: [
    {
      id: 'r1',
      type: 'stale_pr',
      description: "Daniel's PR #482 (auth refactor) has had no review activity in 4 days",
      severity: 'high',
    },
    {
      id: 'r2',
      type: 'blocked_ticket',
      description: 'ENG-1190 blocked on design sign-off since Jul 24',
      severity: 'medium',
    },
    {
      id: 'r3',
      type: 'velocity_drop',
      description: 'Completed points dropped 15% last sprint versus the 3-sprint average',
      severity: 'medium',
    },
  ],
}

export const actionItems: ActionItem[] = [
  {
    id: 'a1',
    memberId: 'm2',
    kind: 'one_on_one',
    title: '1:1 with Daniel — check in on workload',
    dueDate: '2026-07-29',
    status: 'upcoming',
  },
  {
    id: 'a2',
    memberId: 'm5',
    kind: 'one_on_one',
    title: '1:1 with Jonas — 30-day ramp check-in',
    dueDate: '2026-07-30',
    status: 'upcoming',
  },
  {
    id: 'a3',
    memberId: 'm4',
    kind: 'follow_up',
    title: 'Follow up: personal development goal for Sofia',
    dueDate: '2026-08-15',
    status: 'overdue',
  },
  {
    id: 'a4',
    memberId: 'm1',
    kind: 'follow_up',
    title: 'Send Priya feedback on brown bag presentation',
    dueDate: '2026-07-31',
    status: 'upcoming',
  },
  {
    id: 'a5',
    memberId: 'm3',
    kind: 'one_on_one',
    title: '1:1 with Wei — biweekly sync',
    dueDate: '2026-08-04',
    status: 'upcoming',
  },
]
