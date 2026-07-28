import type {
  TeamMember,
  HealthEntry,
  SprintStatus,
  ActionItem,
  AIInsight,
  ActionEntry,
  JiraIssue,
  SlackMessage,
  InitiativeLoadPoint,
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
      id: 'r3',
      type: 'velocity_drop',
      description: 'Completed points dropped 15% last sprint versus the 3-sprint average',
      severity: 'medium',
    },
  ],
}

// Simulated Jira source data — ticket-level detail behind the delivery-risk
// insights, standing in for a real Jira integration.
export const jiraIssues: JiraIssue[] = [
  {
    id: 'ENG-1183',
    title: 'Auth refactor',
    status: 'in_progress',
    assigneeId: 'm2',
    sprint: 'Sprint 24',
    epic: 'Auth Hardening',
    updatedDate: '2026-07-24',
  },
  {
    id: 'ENG-1190',
    title: 'Add checkout confirmation screen',
    status: 'blocked',
    assigneeId: 'm4',
    sprint: 'Sprint 24',
    epic: 'Onboarding Revamp',
    blockedReason: 'Waiting on design sign-off',
    updatedDate: '2026-07-24',
  },
  {
    id: 'ENG-1188',
    title: 'Apply promo discount at checkout',
    status: 'blocked',
    assigneeId: 'm1',
    sprint: 'Sprint 24',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    updatedDate: '2026-07-23',
  },
  {
    id: 'ENG-1191',
    title: 'Refund flow via new payments endpoint',
    status: 'blocked',
    assigneeId: 'm3',
    sprint: 'Sprint 24',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    updatedDate: '2026-07-25',
  },
  {
    id: 'ENG-1195',
    title: 'Migrate subscription billing to v2 endpoint',
    status: 'blocked',
    assigneeId: 'm5',
    sprint: 'Sprint 24',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    updatedDate: '2026-07-26',
  },
]

// Simulated Slack source data — two channels' worth of messages, standing in
// for a real Slack integration.
export const slackMessages: SlackMessage[] = [
  {
    id: 's1',
    channel: '#platform-eng',
    authorName: 'Wei Zhang',
    timestamp: '2026-07-15T09:12:00',
    text: 'Deploy to staging timed out again around the DB migration step — anyone else seeing this?',
    threadId: 't1',
    replyCount: 2,
  },
  {
    id: 's2',
    channel: '#platform-eng',
    authorName: 'Sofia Ramirez',
    timestamp: '2026-07-18T14:05:00',
    text: 'Prod deploy got stuck on the migration step for ~10 min before it went through.',
    threadId: 't2',
    replyCount: 1,
  },
  {
    id: 's3',
    channel: '#platform-eng',
    authorName: 'Daniel Osei',
    timestamp: '2026-07-22T11:40:00',
    text: 'Same deploy timeout as last week, had to restart the pipeline manually.',
    threadId: 't3',
    replyCount: 3,
  },
  {
    id: 's4',
    channel: '#platform-eng',
    authorName: 'Priya Nair',
    timestamp: '2026-07-27T16:20:00',
    text: 'Deploy pipeline timed out on staging again — this is the fourth time this sprint.',
    threadId: 't4',
    replyCount: 4,
  },
  {
    id: 's5',
    channel: '#platform-team',
    authorName: 'Jonas Berg',
    timestamp: '2026-07-25T10:00:00',
    text: 'Quick question — who owns the on-call escalation runbook now that Alex has left the team?',
    threadId: 't5',
    replyCount: 0,
  },
]

// Active initiative count per sprint — pairs with velocityHistory above to
// support the "possible overload" insight (more parallel work, less throughput).
export const initiativeLoad: InitiativeLoadPoint[] = [
  { sprint: 'Sprint 22', activeInitiatives: 2 },
  { sprint: 'Sprint 23', activeInitiatives: 3 },
  { sprint: 'Sprint 24', activeInitiatives: 4 },
]

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
    category: 'delivery_risk',
    title: 'Three sprint tickets are blocked by the same external dependency',
    summary:
      'ENG-1188, ENG-1191, and ENG-1195 are all waiting on the same Payments API v2 contract from the Platform team, with the oldest blocked for 5 days.',
    sources: [
      {
        type: 'jira',
        refId: 'ENG-1188',
        label: 'ENG-1188 "Apply promo discount at checkout" — blocked since Jul 23',
      },
      {
        type: 'jira',
        refId: 'ENG-1191',
        label: 'ENG-1191 "Refund flow via new payments endpoint" — blocked since Jul 25',
      },
      {
        type: 'jira',
        refId: 'ENG-1195',
        label: 'ENG-1195 "Migrate subscription billing to v2 endpoint" — blocked since Jul 26',
      },
    ],
    confidence: 'high',
    recommendedAction: 'Escalate the Payments API v2 contract dependency with the Platform team',
    status: 'accepted',
  },
  {
    id: 'i2',
    category: 'delivery_risk',
    title: 'ENG-1190 is at risk of slipping the sprint',
    summary:
      'The ticket has been blocked on design sign-off for 4 days with only 4 days left in the sprint.',
    sources: [
      {
        type: 'jira',
        refId: 'ENG-1190',
        label: 'ENG-1190 "Add checkout confirmation screen" — blocked on design sign-off since Jul 24',
      },
      { type: 'delivery', label: 'Sprint 24 ends Aug 1 — 4 days remain' },
    ],
    confidence: 'medium',
    recommendedAction: 'Escalate ENG-1190 design sign-off to unblock before sprint end',
    status: 'new',
  },
  {
    id: 'i3',
    category: 'recurring_issue',
    title: 'Deploy problems have been raised in four separate threads over two weeks',
    summary:
      'The same staging/prod deploy timeout has been reported independently four times in #platform-eng since Jul 15, most recently yesterday.',
    sources: [
      {
        type: 'slack',
        refId: 's1',
        label: '#platform-eng, Wei Zhang, Jul 15 — deploy timeout during DB migration step',
      },
      {
        type: 'slack',
        refId: 's2',
        label: '#platform-eng, Sofia Ramirez, Jul 18 — prod deploy stuck on migration step',
      },
      {
        type: 'slack',
        refId: 's3',
        label: '#platform-eng, Daniel Osei, Jul 22 — same timeout, manual pipeline restart',
      },
      {
        type: 'slack',
        refId: 's4',
        label: '#platform-eng, Priya Nair, Jul 27 — fourth occurrence this sprint',
      },
    ],
    confidence: 'high',
    recommendedAction: 'Open an incident/tech-debt ticket to investigate the recurring deploy timeout',
    status: 'new',
  },
  {
    id: 'i4',
    category: 'unresolved_question',
    title: 'A question about on-call ownership has gone unanswered for three days',
    summary:
      'Jonas asked who owns the on-call escalation runbook after Alex left the team — no one has replied in #platform-team since Jul 25.',
    sources: [
      {
        type: 'slack',
        refId: 's5',
        label:
          '#platform-team, Jonas Berg, Jul 25 — "who owns the on-call escalation runbook now that Alex has left?" (0 replies)',
      },
    ],
    confidence: 'medium',
    recommendedAction: 'Clarify on-call escalation ownership in #platform-team',
    status: 'new',
  },
  {
    id: 'i5',
    category: 'possible_overload',
    title: 'Daniel may be heading toward burnout, and it is starting to block delivery',
    summary:
      'Sentiment and workload have both been trending the wrong way for four weeks, and his most recent PR has stalled without review.',
    sources: [
      {
        type: 'health',
        refId: 'm2:2026-07-13',
        label: 'Sentiment 3/5, workload rated heavy (week of Jul 13)',
      },
      {
        type: 'health',
        refId: 'm2:2026-07-20',
        label: 'Sentiment 2/5, workload rated heavy (week of Jul 20)',
      },
      {
        type: 'delivery',
        refId: 'r1',
        label: 'PR #482 (auth refactor) has had no review activity in 4 days',
      },
    ],
    confidence: 'high',
    recommendedAction: 'Check in with Daniel on workload and unblock review on PR #482',
    status: 'new',
  },
  {
    id: 'i6',
    category: 'possible_overload',
    title: 'Parallel initiatives are up while throughput is down',
    summary:
      'The team is now running four active initiatives at once, up from two a month ago, while completed points have fallen for two sprints running.',
    sources: [
      {
        type: 'delivery',
        label: 'Active initiatives per sprint: 2 (Sprint 22) → 3 (Sprint 23) → 4 (Sprint 24)',
      },
      {
        type: 'delivery',
        label: 'Completed points: 39 (Sprint 22) → 33 (Sprint 23) → 18 so far (Sprint 24)',
      },
    ],
    confidence: 'medium',
    recommendedAction: 'Review initiative load and reprioritize with the team before adding new work',
    status: 'accepted',
  },
]

export const actionEntries: ActionEntry[] = [
  {
    id: 'action-i1',
    title: 'Escalate the Payments API v2 contract dependency with the Platform team',
    status: 'suggested',
    owner: null,
    dueDate: null,
    priority: 'high',
    source: 'ai',
    context:
      'ENG-1188, ENG-1191, and ENG-1195 are all waiting on the same Payments API v2 contract from the Platform team, with the oldest blocked for 5 days.',
    createdDate: '2026-07-26',
    sourceInsightId: 'i1',
    sourceInsightTitle: 'Three sprint tickets are blocked by the same external dependency',
    sourceEvidence: [
      'ENG-1188 "Apply promo discount at checkout" — blocked since Jul 23',
      'ENG-1191 "Refund flow via new payments endpoint" — blocked since Jul 25',
      'ENG-1195 "Migrate subscription billing to v2 endpoint" — blocked since Jul 26',
    ],
  },
  {
    id: 'action-i6',
    title: 'Review initiative load and reprioritize with the team before adding new work',
    status: 'active',
    owner: 'Priya Nair',
    dueDate: '2026-07-31',
    priority: 'medium',
    source: 'ai',
    context:
      'The team is now running four active initiatives at once, up from two a month ago, while completed points have fallen for two sprints running.',
    createdDate: '2026-07-20',
    sourceInsightId: 'i6',
    sourceInsightTitle: 'Parallel initiatives are up while throughput is down',
    sourceEvidence: [
      'Active initiatives per sprint: 2 (Sprint 22) → 3 (Sprint 23) → 4 (Sprint 24)',
      'Completed points: 39 (Sprint 22) → 33 (Sprint 23) → 18 so far (Sprint 24)',
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
