import type {
  TeamMember,
  ActionEntry,
  JiraIssue,
  SlackMessage,
  DeliveryGoal,
} from '../types'

// This whole file simulates data that would, in a real deployment, come from
// external tools rather than be hand-authored. Three exports below are the
// actual integration points — see the comment directly above each:
//   `jiraIssues`    <- Jira REST API
//   `slackMessages` <- Slack Web API

export const teamMembers: TeamMember[] = [
  { id: 'm1', name: 'Freya Vanir', initials: 'FV', role: 'Software Engineer' },
  { id: 'm2', name: 'Daniel Osei', initials: 'DO', role: 'Software Engineer' },
  { id: 'm3', name: 'Wei Zhang', initials: 'WZ', role: 'Software Engineer' },
  { id: 'm4', name: 'Emma', initials: 'E', role: 'Engineering Manager' },
  { id: 'm5', name: 'Leo Herculeus', initials: 'LH', role: 'Software Engineer' },
]

// Simulated Jira source data — a kanban board's worth of tickets, standing
// in for a real Jira integration. Statuses and dates are hand-placed so the
// flow signals on Delivery Radar (WIP, staleness, blocked age, cycle time)
// come out to something realistic rather than being computed from nothing.
//
// To replace with a real Jira integration (REST API `/rest/api/3/search`
// with a JQL query scoped to your board/project), map fields as:
//   id                   <- issue.key (e.g. "TFP-2")
//   title                <- issue.fields.summary
//   status               <- issue.fields.status mapped through your own
//                           status-category table, since Jira status names
//                           are workflow-specific ("In Review", "Ready for
//                           QA", ...) and need to collapse onto our four
//                           values: 'todo' | 'in_progress' | 'blocked' | 'done'
//   assigneeId           <- issue.fields.assignee.accountId
//   epic                 <- issue.fields.parent (or your epic-link custom
//                           field, depending on how the project is configured)
//   blockedReason        <- a "Blocked reason" custom field, or the text of
//                           a "flagged" comment, depending on team convention
//   blockedSince         <- NOT a current-state field — requires the issue
//                           changelog (`expand=changelog`) to find the most
//                           recent transition into a blocked status
//   startedDate/doneDate <- same story: derived from changelog transitions
//                           into "In Progress" / "Done", not stored directly
//   crossTeamDependency  <- likely a label or custom field; there's no
//                           standard Jira field for this, so it depends on
//                           how your team already tags cross-team blockers
export const jiraIssues: JiraIssue[] = [
  // --- In progress ---
  {
    id: 'TFP-1',
    title: 'Auth refactor',
    status: 'in_progress',
    assigneeId: 'm2',
    epic: 'Auth Hardening',
    updatedDate: '2026-07-24',
  },
  {
    id: 'TFP-2',
    title: 'Add analytics event for checkout funnel',
    status: 'in_progress',
    assigneeId: 'm1',
    epic: 'Payments Migration',
    updatedDate: '2026-07-27',
  },
  {
    id: 'TFP-3',
    title: 'Optimize webhook retry logic',
    status: 'in_progress',
    assigneeId: 'm3',
    epic: 'Payments Migration',
    updatedDate: '2026-07-21',
  },
  {
    id: 'TFP-4',
    title: 'Redesign empty states for dashboard widgets',
    status: 'in_progress',
    assigneeId: 'm4',
    epic: 'Design System v2',
    updatedDate: '2026-07-26',
  },
  // Leo Herculeus is carrying five concurrent tickets — the High WIP example.
  {
    id: 'TFP-5',
    title: 'Fix pagination bug in admin table',
    status: 'in_progress',
    assigneeId: 'm5',
    epic: 'Design System v2',
    updatedDate: '2026-07-27',
  },
  {
    id: 'TFP-6',
    title: 'Add CSV export for reports',
    status: 'in_progress',
    assigneeId: 'm5',
    epic: 'Onboarding Revamp',
    updatedDate: '2026-07-25',
  },
  {
    id: 'TFP-7',
    title: 'Update onboarding email templates',
    status: 'in_progress',
    assigneeId: 'm5',
    epic: 'Onboarding Revamp',
    updatedDate: '2026-07-20',
  },
  {
    id: 'TFP-8',
    title: 'Investigate slow query on dashboard load',
    status: 'in_progress',
    assigneeId: 'm5',
    epic: 'Auth Hardening',
    updatedDate: '2026-07-27',
  },
  {
    id: 'TFP-9',
    title: 'Add feature flag for new checkout flow',
    status: 'in_progress',
    assigneeId: 'm5',
    epic: 'Payments Migration',
    updatedDate: '2026-07-24',
  },

  // --- Blocked ---
  {
    id: 'TFP-10',
    title: 'Add checkout confirmation screen',
    status: 'blocked',
    assigneeId: 'm4',
    epic: 'Onboarding Revamp',
    blockedReason: 'Waiting on design sign-off',
    blockedSince: '2026-07-24',
    updatedDate: '2026-07-24',
  },
  {
    id: 'TFP-11',
    title: 'Apply promo discount at checkout',
    status: 'blocked',
    assigneeId: 'm1',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    blockedSince: '2026-07-23',
    crossTeamDependency: 'Platform team',
    updatedDate: '2026-07-23',
  },
  {
    id: 'TFP-12',
    title: 'Refund flow via new payments endpoint',
    status: 'blocked',
    assigneeId: 'm3',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    blockedSince: '2026-07-25',
    crossTeamDependency: 'Platform team',
    updatedDate: '2026-07-25',
  },
  {
    id: 'TFP-13',
    title: 'Migrate subscription billing to v2 endpoint',
    status: 'blocked',
    assigneeId: 'm5',
    epic: 'Payments Migration',
    blockedReason: 'Waiting on Payments API v2 contract from Platform team',
    blockedSince: '2026-07-26',
    crossTeamDependency: 'Platform team',
    updatedDate: '2026-07-26',
  },
  {
    id: 'TFP-14',
    title: 'Provision staging environment for new payments service',
    status: 'blocked',
    assigneeId: 'm2',
    epic: 'Payments Migration',
    blockedReason: 'Infrastructure waiting on staging environment provisioning',
    blockedSince: '2026-07-23',
    updatedDate: '2026-07-23',
  },
  {
    id: 'TFP-15',
    title: 'Clarify discount stacking rules for promo codes',
    status: 'blocked',
    assigneeId: 'm4',
    epic: 'Payments Migration',
    blockedReason: 'Waiting for product clarification',
    blockedSince: '2026-07-26',
    updatedDate: '2026-07-26',
  },

  // --- Done, previous 14-day window (Jul 1–14) — cycle time comparison base ---
  {
    id: 'TFP-16',
    title: 'Add rate limiting to public API',
    status: 'done',
    assigneeId: 'm3',
    epic: 'Auth Hardening',
    startedDate: '2026-07-01',
    doneDate: '2026-07-04',
    updatedDate: '2026-07-04',
  },
  {
    id: 'TFP-17',
    title: 'Migrate email templates to new service',
    status: 'done',
    assigneeId: 'm4',
    epic: 'Onboarding Revamp',
    startedDate: '2026-07-03',
    doneDate: '2026-07-07',
    updatedDate: '2026-07-07',
  },
  {
    id: 'TFP-18',
    title: 'Refactor checkout state machine',
    status: 'done',
    assigneeId: 'm1',
    epic: 'Payments Migration',
    startedDate: '2026-07-05',
    doneDate: '2026-07-10',
    updatedDate: '2026-07-10',
  },
  {
    id: 'TFP-19',
    title: 'Research Claude Code skills for code review',
    status: 'done',
    assigneeId: 'm2',
    epic: 'Improve code review quality with AI-assisted review',
    startedDate: '2026-07-08',
    doneDate: '2026-07-12',
    updatedDate: '2026-07-12',
  },
  {
    id: 'TFP-20',
    title: 'Define frontend code review guidelines',
    status: 'done',
    assigneeId: 'm5',
    epic: 'Improve code review quality with AI-assisted review',
    startedDate: '2026-07-10',
    doneDate: '2026-07-13',
    updatedDate: '2026-07-13',
  },

  // --- Done, current 14-day window (Jul 15–28) ---
  {
    id: 'TFP-21',
    title: 'Create reusable Claude Code review skill',
    status: 'done',
    assigneeId: 'm3',
    epic: 'Improve code review quality with AI-assisted review',
    startedDate: '2026-07-15',
    doneDate: '2026-07-19',
    updatedDate: '2026-07-19',
  },
  {
    id: 'TFP-22',
    title: 'Pilot AI-assisted code reviews with FE Platform Team',
    status: 'done',
    assigneeId: 'm1',
    epic: 'Improve code review quality with AI-assisted review',
    startedDate: '2026-07-17',
    doneDate: '2026-07-22',
    updatedDate: '2026-07-22',
  },
  {
    id: 'TFP-23',
    title: 'Redesign settings navigation',
    status: 'done',
    assigneeId: 'm4',
    epic: 'Design System v2',
    startedDate: '2026-07-19',
    doneDate: '2026-07-25',
    updatedDate: '2026-07-25',
  },
  {
    id: 'TFP-24',
    title: 'Add retry logic for failed payments',
    status: 'done',
    assigneeId: 'm2',
    epic: 'Payments Migration',
    startedDate: '2026-07-21',
    doneDate: '2026-07-26',
    updatedDate: '2026-07-26',
  },
  {
    id: 'TFP-25',
    title: 'Update onboarding checklist copy',
    status: 'done',
    assigneeId: 'm5',
    epic: 'Onboarding Revamp',
    startedDate: '2026-07-23',
    doneDate: '2026-07-28',
    updatedDate: '2026-07-28',
  },
]

// Seed for the EM's editable delivery goal — persisted client-side (see
// useDeliveryGoal), this is just the first-load default.
export const deliveryGoalSeed: DeliveryGoal = {
  text: 'Improve code review quality with AI-assisted review',
  linkedIssueIds: ['TFP-19', 'TFP-20', 'TFP-21', 'TFP-22'],
}

// Simulated Slack source data, standing in for a real Slack integration.
// Four channels, matching how this team actually organizes Slack:
//   #platform-release — deploy/release chatter, plus automated posts from
//     the Jira <-> Slack integration (e.g. "ticket moved to Blocked")
//   #platform-help     — questions and requests for help
//   #platform-team     — team coordination and automated service alerts
//   #incidents         — formal incident declarations and updates
//
// To replace with a real Slack integration (Slack Web API), map fields as:
//   channel     <- the channel name for each conversations.history call;
//                  you'd poll/subscribe to exactly the four above
//   authorName  <- users.info lookup on the message's `user` id — Slack's
//                  history API only returns user IDs, not display names
//   timestamp   <- the message's `ts`, converted from a Slack timestamp
//                  (seconds.microseconds) to an ISO datetime
//   threadId    <- `thread_ts` (present on any message that's part of a
//                  thread; conversations.replies fetches the full thread)
//   replyCount  <- `reply_count` on the thread's root message
// Bot-authored messages (like the Jira Bot post below) come through the
// same API — Slack doesn't distinguish bot messages structurally, only via
// the `bot_id` field on the message.
export const slackMessages: SlackMessage[] = [
  {
    id: 's1',
    channel: '#platform-release',
    authorName: 'Wei Zhang',
    timestamp: '2026-07-15T09:12:00',
    text: 'Deploy to staging timed out again around the DB migration step — anyone else seeing this?',
    threadId: 't1',
    replyCount: 2,
  },
  {
    id: 's2',
    channel: '#platform-release',
    authorName: 'Emma',
    timestamp: '2026-07-18T14:05:00',
    text: 'Prod deploy got stuck on the migration step for ~10 min before it went through.',
    threadId: 't2',
    replyCount: 1,
  },
  {
    id: 's3',
    channel: '#platform-release',
    authorName: 'Daniel Osei',
    timestamp: '2026-07-22T11:40:00',
    text: 'Same deploy timeout as last week, had to restart the pipeline manually.',
    threadId: 't3',
    replyCount: 3,
  },
  {
    id: 's4',
    channel: '#platform-release',
    authorName: 'Freya Vanir',
    timestamp: '2026-07-27T16:20:00',
    text: 'Deploy pipeline timed out on staging again — this is the fourth time this sprint.',
    threadId: 't4',
    replyCount: 4,
  },
  {
    id: 's6',
    channel: '#platform-release',
    authorName: 'Jira Bot',
    timestamp: '2026-07-23T08:00:00',
    text: 'TFP-11 moved to Blocked — waiting on Payments API v2 contract from Platform team.',
    threadId: 't6',
    replyCount: 0,
  },
  {
    id: 's5',
    channel: '#platform-help',
    authorName: 'Leo Herculeus',
    timestamp: '2026-07-25T10:00:00',
    text: 'Quick question — who owns the on-call escalation runbook now that Alex has left the team?',
    threadId: 't5',
    replyCount: 0,
  },
  {
    id: 's7',
    channel: '#platform-team',
    authorName: 'Monitoring Bot',
    timestamp: '2026-07-26T13:45:00',
    text: 'Error rate on checkout-service exceeded 2% for 15 minutes (threshold: 1%).',
    threadId: 't7',
    replyCount: 0,
  },
  {
    id: 's8',
    channel: '#incidents',
    authorName: 'Wei Zhang',
    timestamp: '2026-07-24T16:30:00',
    text: 'INC-014: Elevated latency on Payments API — investigating.',
    threadId: 't8',
    replyCount: 2,
  },
]

export const actionEntries: ActionEntry[] = [
  {
    id: 'action-signal-jira-blocked-work',
    title: 'Confirm the next step and unblock owner for TFP-15',
    status: 'suggested',
    owner: null,
    dueDate: null,
    priority: 'medium',
    source: 'signal',
    context:
      'TFP-15 “Memory leak in dashboard polling” is currently blocked in Jira and needs a clear next step.',
    createdDate: '2026-07-29',
    sourceSignalId: 'signal-jira-blocked-work',
    sourceSignalTitle: 'Blocked work needs follow-up',
    sourceDataMode: 'demo',
    sourceEvidence: [
      'TFP-15 “Memory leak in dashboard polling” — Blocked in Jira',
    ],
    linkedJiraIssueIds: ['TFP-15'],
  },
  {
    id: 'action-i6',
    title: 'Review initiative load and reprioritize with the team before adding new work',
    status: 'active',
    owner: 'Freya Vanir',
    dueDate: '2026-07-31',
    priority: 'medium',
    source: 'signal',
    context:
      'The team is now running four active initiatives at once, up from two a month ago, while completed points have fallen for two sprints running.',
    createdDate: '2026-07-20',
    decisionDate: '2026-07-20',
    sourceSignalId: 'signal-demo-initiative-load',
    sourceSignalTitle: 'Parallel initiatives are up while throughput is down',
    sourceDataMode: 'demo',
    sourceEvidence: [
      'Active initiatives per sprint: 2 (Sprint 22) → 3 (Sprint 23) → 4 (Sprint 24)',
      'Completed points: 39 (Sprint 22) → 33 (Sprint 23) → 18 so far (Sprint 24)',
    ],
  },
  {
    id: 'action-onboarding',
    title: 'Set up an onboarding buddy pairing for Leo',
    status: 'active',
    owner: 'Emma',
    dueDate: '2026-08-03',
    priority: 'medium',
    source: 'manual',
    context: "Leo Herculeus joins in three weeks and doesn't have a designated buddy yet.",
    createdDate: '2026-07-20',
    decisionDate: '2026-07-20',
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
    decisionDate: '2026-07-26',
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
    decisionDate: '2026-07-16',
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
    decisionDate: '2026-07-13',
  },
]
