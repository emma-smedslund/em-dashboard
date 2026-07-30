import type {
  JiraDataSource,
  JiraIssue,
  PullRequestPeriodMetric,
  RetrospectiveActionPoint,
  SlackMessage,
  SlackDataSource,
  TeamSignal,
} from '../types'
import { daysBetween, toISODate } from './date'

interface SignalInput {
  jiraIssues: JiraIssue[]
  jiraDataSource: JiraDataSource
  slackMessages: SlackMessage[]
  slackDataSource: SlackDataSource
  pullRequestMetrics: PullRequestPeriodMetric[]
  retrospectiveActions: RetrospectiveActionPoint[]
  referenceDate?: Date
}

// Deterministic detection is intentionally separate from presentation and
// broader AI interpretation. New source-specific detectors can be added here
// without changing the Team Signals page model.
export function detectTeamSignals({
  jiraIssues,
  jiraDataSource,
  slackMessages,
  slackDataSource,
  pullRequestMetrics,
  retrospectiveActions,
  referenceDate = new Date(),
}: SignalInput): TeamSignal[] {
  const detectedAt = toISODate(referenceDate)
  const jiraMode = jiraDataSource === 'live' ? 'live' : 'demo'
  const signals: TeamSignal[] = []

  const blocked = jiraIssues.filter((issue) => issue.status === 'blocked')
  if (blocked.length > 0) {
    signals.push({
      id: 'signal-jira-blocked-work',
      title: 'Blocked work needs follow-up',
      summary: `${blocked.length} ${blocked.length === 1 ? 'issue is' : 'issues are'} currently blocked. This is worth reviewing for ownership or dependency follow-up.`,
      category: 'Delivery',
      severity: blocked.length >= 3 ? 'Attention' : 'Watch',
      confidence: blocked.length >= 3 ? 'high' : 'medium',
      source: 'Jira',
      sourceMode: jiraMode,
      detectedAt,
      timeRange: 'Current state',
      evidence: blocked.slice(0, 5).map((issue) => ({
        refId: issue.id,
        label: `${issue.id} · ${issue.title}${issue.blockedReason ? ` — ${issue.blockedReason}` : ''}`,
      })),
      suggestedFollowUp: 'Confirm the next step and unblock owner for each affected issue.',
      status: 'New',
    })
  }

  const stale = jiraIssues
    .filter((issue) => issue.status === 'in_progress')
    .map((issue) => ({ issue, days: daysBetween(issue.updatedDate, detectedAt) }))
    .filter(({ days }) => days >= 5)
    .sort((a, b) => b.days - a.days)
  if (stale.length > 0) {
    signals.push({
      id: 'signal-jira-stale-work',
      title: 'Active work has gone quiet',
      summary: `${stale.length} active ${stale.length === 1 ? 'issue has' : 'issues have'} had no Jira activity for at least five days. This may indicate a blocker, changed priority, or missing update.`,
      category: 'Delivery',
      severity: 'Watch',
      confidence: 'medium',
      source: 'Jira',
      sourceMode: jiraMode,
      detectedAt,
      timeRange: 'Last 5+ days',
      evidence: stale.slice(0, 5).map(({ issue, days }) => ({
        refId: issue.id,
        label: `${issue.id} · ${issue.title} — no activity for ${days} days`,
      })),
      suggestedFollowUp: 'Check whether the work should be unblocked, updated, or returned to the backlog.',
      status: 'New',
    })
  }

  const active = jiraIssues.filter((issue) => issue.status === 'in_progress')
  const activeByAssignee = new Map<string, number>()
  for (const issue of active) {
    if (issue.assigneeId === 'unassigned') continue
    activeByAssignee.set(issue.assigneeId, (activeByAssignee.get(issue.assigneeId) ?? 0) + 1)
  }
  const largestShare = Math.max(0, ...activeByAssignee.values())
  if (largestShare > 3) {
    signals.push({
      id: 'signal-jira-work-concentration',
      title: 'Active work is concentrated',
      summary: 'A large share of active Jira work is assigned to one contributor. This may indicate a flow or ownership issue, not an individual performance concern.',
      category: 'Collaboration',
      severity: 'Watch',
      confidence: largestShare >= 5 ? 'high' : 'medium',
      source: 'Jira',
      sourceMode: jiraMode,
      detectedAt,
      timeRange: 'Current state',
      evidence: [{ label: `${largestShare} of ${active.length} active issues are assigned to one contributor.` }],
      suggestedFollowUp: 'Review parallel work and whether ownership can be shared or narrowed.',
      status: 'New',
    })
  }

  const deployThreads = slackMessages.filter(
    (message) =>
      message.channel === '#platform-release' &&
      /(deploy|pipeline)/i.test(message.text) &&
      /(timeout|timed out|stuck)/i.test(message.text),
  )
  if (deployThreads.length >= 3) {
    signals.push({
      id: 'signal-slack-recurring-release-friction',
      title: 'Recurring release friction',
      summary: 'Similar deployment problems have appeared in several separate Slack discussions. The pattern may deserve a shared technical follow-up.',
      category: 'Quality',
      severity: 'Attention',
      confidence: deployThreads.length >= 4 ? 'high' : 'medium',
      source: 'Slack',
      sourceMode: slackDataSource,
      detectedAt,
      timeRange: 'Last 2 weeks',
      evidence: deployThreads.map((message) => ({
        refId: message.id,
        label: `${message.channel} · ${message.text}`,
      })),
      suggestedFollowUp: 'Create an improvement action and discuss recurring causes in the next retrospective.',
      status: 'New',
    })
  }

  const unansweredQuestions = slackMessages
    .filter(
      (message) =>
        ['#platform-help', '#platform-team'].includes(message.channel) &&
        message.replyCount === 0 &&
        /\?|\b(who|what|when|where|why|how|can someone|does anyone)\b/i.test(message.text),
    )
    .map((message) => ({
      message,
      daysOpen: daysBetween(message.timestamp.slice(0, 10), detectedAt),
    }))
    .filter(({ daysOpen }) => daysOpen >= 3)
    .sort((a, b) => b.daysOpen - a.daysOpen)

  if (unansweredQuestions.length > 0) {
    const { message, daysOpen } = unansweredQuestions[0]
    signals.push({
      id: `signal-slack-unanswered-${message.id}`,
      title: 'A team question may need an owner',
      summary: `${message.authorName} posted a question in ${message.channel} that has had no recorded replies for ${daysOpen} days.`,
      category: 'Collaboration',
      severity: daysOpen >= 5 ? 'Attention' : 'Watch',
      confidence: daysOpen >= 5 ? 'high' : 'medium',
      source: 'Slack',
      sourceMode: slackDataSource,
      detectedAt,
      timeRange: `${daysOpen} days without replies`,
      evidence: [{
        refId: message.id,
        label: `${message.channel} · ${message.authorName}: ${message.text}`,
      }],
      suggestedFollowUp: `Clarify ownership or answer the open question in ${message.channel}.`,
      status: 'New',
    })
  }

  const currentReview = pullRequestMetrics.find((metric) => metric.period === 'current')
  const previousReview = pullRequestMetrics.find((metric) => metric.period === 'previous')
  if (currentReview && previousReview && currentReview.medianReviewHours > previousReview.medianReviewHours) {
    signals.push({
      id: 'signal-github-review-time',
      title: 'Review time increasing',
      summary: `Median pull request review time increased from ${previousReview.medianReviewHours} to ${currentReview.medianReviewHours} hours. Review activity is also concentrated, which may indicate a capacity or ownership issue.`,
      category: 'Collaboration',
      severity: 'Watch',
      confidence: 'medium',
      source: 'GitHub',
      sourceMode: 'demo',
      detectedAt,
      timeRange: 'Last 30 days vs previous 30 days',
      evidence: [
        { label: `Median review time: ${previousReview.medianReviewHours}h → ${currentReview.medianReviewHours}h` },
        { label: `Top two reviewers handled ${currentReview.topTwoReviewerShare}% of reviews this period.` },
      ],
      suggestedFollowUp: 'Check reviewer capacity and whether review ownership can be distributed.',
      status: 'New',
    })
  }

  const stalledRetro = retrospectiveActions.find(
    (action) => action.status === 'open' && daysBetween(action.updatedDate, detectedAt) >= 14,
  )
  if (stalledRetro) {
    signals.push({
      id: `signal-retro-${stalledRetro.id}`,
      title: 'Retrospective action has not progressed',
      summary: 'An agreed improvement action has had no recorded progress for several weeks.',
      category: 'Retrospective',
      severity: 'Watch',
      confidence: 'medium',
      source: 'Retrospective',
      sourceMode: 'demo',
      detectedAt,
      timeRange: 'Since the last retrospective cycle',
      evidence: [{ label: `${stalledRetro.title} · Theme: ${stalledRetro.theme}` }],
      suggestedFollowUp: 'Confirm whether the action is still relevant and assign a next step or close it.',
      status: 'New',
    })
  }

  const severityOrder = { Attention: 0, Watch: 1, Info: 2 }
  return signals.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}
