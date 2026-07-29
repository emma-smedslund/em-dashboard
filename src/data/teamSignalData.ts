import type { PullRequestPeriodMetric, RetrospectiveActionPoint } from '../types'

// Demo stand-ins for a future GitHub integration. A real connector should
// aggregate pull request timestamps and reviewer participation into the same
// period-level contract before the deterministic detector runs.
export const pullRequestPeriodMetrics: PullRequestPeriodMetric[] = [
  { period: 'previous', medianReviewHours: 7, topTwoReviewerShare: 48 },
  { period: 'current', medianReviewHours: 22, topTwoReviewerShare: 74 },
]

// Demo stand-ins for retrospective notes/action points. This contract can be
// populated later from the team's chosen retro or documentation tool.
export const retrospectiveActionPoints: RetrospectiveActionPoint[] = [
  {
    id: 'retro-1',
    title: 'Define ownership for flaky integration tests',
    theme: 'Build reliability',
    status: 'open',
    createdDate: '2026-06-30',
    updatedDate: '2026-07-07',
  },
  {
    id: 'retro-2',
    title: 'Add a release readiness checklist',
    theme: 'Release reliability',
    status: 'resolved',
    createdDate: '2026-07-01',
    updatedDate: '2026-07-18',
  },
]
