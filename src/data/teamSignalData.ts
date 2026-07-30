import type { PullRequestPeriodMetric } from '../types'

// Demo stand-ins for a future GitHub integration. A real connector should
// aggregate pull request timestamps and reviewer participation into the same
// period-level contract before the deterministic detector runs.
export const pullRequestPeriodMetrics: PullRequestPeriodMetric[] = [
  { period: 'previous', medianReviewHours: 7, topTwoReviewerShare: 48 },
  { period: 'current', medianReviewHours: 22, topTwoReviewerShare: 74 },
]
