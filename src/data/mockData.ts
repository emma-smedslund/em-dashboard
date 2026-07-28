import type {
  TeamMember,
  HealthEntry,
  SprintStatus,
  ActionItem,
  AIInsight,
  ActionEntry,
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
  },
  {
    id: 'a2',
    memberId: 'm5',
    kind: 'one_on_one',
    title: '1:1 with Jonas — 30-day ramp check-in',
    dueDate: '2026-07-30',
  },
  {
    id: 'a3',
    memberId: 'm4',
    kind: 'follow_up',
    title: 'Follow up: personal development goal for Sofia',
    dueDate: '2026-07-25',
  },
  {
    id: 'a4',
    memberId: 'm1',
    kind: 'follow_up',
    title: 'Send Priya feedback on brown bag presentation',
    dueDate: '2026-07-31',
  },
  {
    id: 'a5',
    memberId: 'm3',
    kind: 'one_on_one',
    title: '1:1 with Wei — biweekly sync',
    dueDate: '2026-08-04',
  },
]

export const aiInsights: AIInsight[] = [
  {
    id: 'i1',
    title:
      'Daniel may be heading toward burnout, and it is starting to block delivery',
    summary:
      'Sentiment and workload have both been trending the wrong way for four weeks, and his most recent PR has stalled without review.',
    rationale: [
      'Sentiment dropped from 4/5 to 2/5 over the last 4 weekly check-ins (Team Health Pulse)',
      'Workload rated "heavy" in the most recent check-in',
      'PR #482 (auth refactor) has had no review activity in 4 days (Delivery Radar)',
    ],
    confidence: 'high',
    recommendedAction: 'Check in with Daniel on workload and unblock review on PR #482',
    status: 'new',
  },
  {
    id: 'i2',
    title: 'ENG-1190 is at risk of slipping the sprint',
    summary:
      'The ticket has been blocked on design sign-off for 4 days with only 4 days left in the sprint.',
    rationale: [
      'ENG-1190 blocked on design sign-off since Jul 24 (Delivery Radar)',
      'Sprint 24 ends Aug 1 — 4 days remain',
    ],
    confidence: 'medium',
    recommendedAction: 'Escalate ENG-1190 design sign-off to unblock before sprint end',
    status: 'new',
  },
  {
    id: 'i3',
    title: 'Sprint velocity may be trending down',
    summary:
      'Completed points came in under the recent average last sprint — worth a look in retro before it becomes a pattern.',
    rationale: [
      'Sprint 23 completed 33 points vs. a 36-point average across Sprints 21–23 (Delivery Radar)',
      'Sprint 24 is also tracking below its committed total so far',
    ],
    confidence: 'low',
    recommendedAction: 'Add a velocity-trend discussion to the next sprint retro',
    status: 'new',
  },
  {
    id: 'i4',
    title: 'Code review turnaround is creeping up across the team',
    summary:
      'Median time-to-first-review has climbed over the last two sprints, most visibly on stalled PRs like #482.',
    rationale: [
      'Median time-to-first-review rose from 6 hours to a day and a half over Sprints 22–24 (Delivery Radar)',
      'PR #482 sat 4 days without review before being flagged (Delivery Radar)',
    ],
    confidence: 'medium',
    recommendedAction: 'Add a code-review SLA reminder to the team norms doc',
    status: 'accepted',
  },
  {
    id: 'i5',
    title: 'Design review is becoming a bottleneck across tickets',
    summary:
      'Two of the last three blocked tickets stalled on design sign-off rather than engineering capacity.',
    rationale: [
      'ENG-1190 blocked on design sign-off since Jul 24 (Delivery Radar)',
      'A similar block occurred on ENG-1173 earlier this sprint',
    ],
    confidence: 'high',
    recommendedAction: 'Escalate design review staffing with the design lead',
    status: 'accepted',
  },
]

export const actionEntries: ActionEntry[] = [
  {
    id: 'action-i4',
    title: 'Add a code-review SLA reminder to the team norms doc',
    status: 'suggested',
    owner: null,
    dueDate: null,
    priority: 'medium',
    source: 'ai',
    context: 'Median time-to-first-review has climbed over the last two sprints.',
    createdDate: '2026-07-24',
    sourceInsightId: 'i4',
    sourceInsightTitle: 'Code review turnaround is creeping up across the team',
    sourceEvidence: [
      'Median time-to-first-review rose from 6 hours to a day and a half over Sprints 22–24 (Delivery Radar)',
      'PR #482 sat 4 days without review before being flagged (Delivery Radar)',
    ],
  },
  {
    id: 'action-i5',
    title: 'Escalate design review staffing with the design lead',
    status: 'active',
    owner: 'Priya Nair',
    dueDate: '2026-07-30',
    priority: 'high',
    source: 'ai',
    context:
      'Two of the last three blocked tickets stalled on design sign-off rather than engineering capacity.',
    createdDate: '2026-07-18',
    sourceInsightId: 'i5',
    sourceInsightTitle: 'Design review is becoming a bottleneck across tickets',
    sourceEvidence: [
      'ENG-1190 blocked on design sign-off since Jul 24 (Delivery Radar)',
      'A similar block occurred on ENG-1173 earlier this sprint',
    ],
  },
  {
    id: 'action-onboarding',
    title: 'Set up an onboarding buddy pairing for Jonas',
    status: 'active',
    owner: 'Sofia Ramirez',
    dueDate: '2026-08-03',
    priority: 'medium',
    source: 'manual',
    context: "Jonas joined three weeks ago and doesn't have a designated buddy yet.",
    createdDate: '2026-07-20',
  },
  {
    id: 'action-oncall',
    title: 'Rotate on-call schedule for August',
    status: 'active',
    owner: 'Wei Zhang',
    dueDate: '2026-07-31',
    priority: 'low',
    source: 'manual',
    context: "August rotation hasn't been published yet.",
    createdDate: '2026-07-26',
  },
  {
    id: 'action-charter',
    title: 'Draft Q3 team charter refresh',
    status: 'completed',
    owner: 'Me',
    dueDate: '2026-07-15',
    priority: 'low',
    source: 'manual',
    context: 'Annual refresh of team working agreements.',
    createdDate: '2026-07-10',
    completedDate: '2026-07-16',
  },
  {
    id: 'action-ci',
    title: 'Investigate flaky CI job on the integration suite',
    status: 'dismissed',
    owner: null,
    dueDate: null,
    priority: 'medium',
    source: 'manual',
    context: 'Turned out to be a flaky third-party test dependency — not worth tracking further.',
    createdDate: '2026-07-12',
  },
]
