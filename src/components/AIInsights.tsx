import { useState } from 'react'
import type {
  AIInsight,
  InsightSource,
  JiraIssue,
  SlackMessage,
  HealthEntry,
  TeamMember,
  InsightCategory,
  JiraDataSource,
} from '../types'
import { getJiraStatus } from '../lib/jira'
import { StatusPill } from './StatusPill'

const CONFIDENCE_PILL = {
  high: { level: 'good' as const, label: 'High confidence' },
  medium: { level: 'warning' as const, label: 'Medium confidence' },
  low: { level: 'neutral' as const, label: 'Low confidence' },
}

const CATEGORY_LABEL: Record<InsightCategory, string> = {
  delivery_risk: 'Delivery risk',
  recurring_issue: 'Recurring issue',
  unresolved_question: 'Unresolved question',
  possible_overload: 'Possible overload',
}

// Date-only strings (e.g. JiraIssue.updatedDate) need a local-midnight
// anchor — otherwise new Date() parses them as UTC and can render a day off.
function formatShortDate(dateOrDatetime: string): string {
  const iso = dateOrDatetime.includes('T') ? dateOrDatetime : `${dateOrDatetime}T00:00:00`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SourceCard({
  source,
  jiraIssues,
  slackMessages,
  healthEntries,
  members,
  jiraDataSource,
}: {
  source: InsightSource
  jiraIssues: JiraIssue[]
  slackMessages: SlackMessage[]
  healthEntries: HealthEntry[]
  members: TeamMember[]
  jiraDataSource: JiraDataSource
}) {
  if (source.type === 'jira') {
    const issue = jiraIssues.find((i) => i.id === source.refId)
    if (issue) {
      const assignee = members.find((m) => m.id === issue.assigneeId)
      return (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {jiraDataSource === 'live' ? 'Live Jira' : 'Demo Jira'}
          </p>
          {issue.url ? (
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[var(--series-blue)] hover:underline"
            >
              {issue.id} · {issue.title}
            </a>
          ) : (
            <p className="text-xs font-medium text-[var(--text-primary)]">
              {issue.id} · {issue.title}
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)]">
            {issue.status === 'blocked' && issue.blockedReason
              ? `Blocked: ${issue.blockedReason}`
              : getJiraStatus(issue).label}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {issue.assigneeName ?? assignee?.name ?? 'Unassigned'} · Updated {formatShortDate(issue.updatedDate)}
          </p>
        </>
      )
    }
  }

  if (source.type === 'slack') {
    const message = slackMessages.find((m) => m.id === source.refId)
    if (message) {
      return (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Demo Slack
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {message.channel} · {message.authorName} · {formatShortDate(message.timestamp)}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">&ldquo;{message.text}&rdquo;</p>
          <p className="text-xs text-[var(--text-muted)]">
            {message.replyCount === 0
              ? 'No replies yet'
              : `${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}`}
          </p>
        </>
      )
    }
  }

  if (source.type === 'health' && source.refId) {
    const [memberId, week] = source.refId.split(':')
    const member = members.find((m) => m.id === memberId)
    const entry = healthEntries.find((h) => h.memberId === memberId && h.week === week)
    if (member && entry) {
      return (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Demo Team Pulse
          </p>
          <p className="text-xs font-medium text-[var(--text-primary)]">{member.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Sentiment {entry.sentiment}/5 · Workload {entry.workload}/5
          </p>
          <p className="text-xs text-[var(--text-muted)]">Week of {formatShortDate(entry.week)}</p>
        </>
      )
    }
  }

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Demo delivery signal
      </p>
      <p className="text-xs text-[var(--text-secondary)]">{source.label}</p>
    </>
  )
}

export function AIInsights({
  insights,
  jiraIssues,
  slackMessages,
  healthEntries,
  members,
  jiraDataSource,
  projectKey,
  syncedAt,
  loading,
  error,
  jiraInsightCount,
  onRefreshJira,
  onAddToActions,
  onDismiss,
}: {
  insights: AIInsight[]
  jiraIssues: JiraIssue[]
  slackMessages: SlackMessage[]
  healthEntries: HealthEntry[]
  members: TeamMember[]
  jiraDataSource: JiraDataSource
  projectKey: string | null
  syncedAt: string | null
  loading: boolean
  error: string | null
  jiraInsightCount: number
  onRefreshJira: () => void
  onAddToActions: (insightId: string) => void
  onDismiss: (insightId: string) => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpanded(insightId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(insightId)) next.delete(insightId)
      else next.add(insightId)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            level={jiraDataSource === 'live' ? 'good' : 'neutral'}
            label={jiraDataSource === 'live' ? `Live Jira · ${projectKey ?? ''}` : 'Demo Jira data'}
          />
          <StatusPill level="neutral" label="Demo Slack + Team Pulse" />
          <span className="text-xs text-[var(--text-muted)]">
            {loading
              ? 'Analyzing Jira signals…'
              : jiraDataSource === 'live' && syncedAt
                ? `${jiraInsightCount} Jira ${jiraInsightCount === 1 ? 'insight' : 'insights'} · synced ${new Date(syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : error ?? 'Live Jira is unavailable.'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRefreshJira}
          disabled={loading}
          className="text-xs font-medium text-[var(--series-blue)] hover:underline disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh Jira'}
        </button>
      </div>

      {!loading && jiraInsightCount === 0 && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 text-sm text-[var(--text-muted)]">
          No Jira risk patterns were detected in the currently loaded issues.
        </p>
      )}

      <ul className="space-y-3">
      {insights.map((insight) => {
        const confidence = CONFIDENCE_PILL[insight.confidence]
        const isExpanded = expandedIds.has(insight.id)

        return (
          <li
            key={insight.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {CATEGORY_LABEL[insight.category]}
                </p>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {insight.title}
                </h3>
              </div>
              <StatusPill level={confidence.level} label={confidence.label} />
            </div>

            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {insight.summary}
            </p>

            <button
              type="button"
              onClick={() => toggleExpanded(insight.id)}
              className="mt-2 text-xs text-[var(--series-blue)] hover:underline"
            >
              {isExpanded
                ? 'Hide evidence'
                : `Show evidence (${insight.sources.length} ${insight.sources.length === 1 ? 'source' : 'sources'})`}
            </button>

            {isExpanded && (
              <ul className="mt-2 space-y-2">
                {insight.sources.map((source, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-2"
                  >
                    <SourceCard
                      source={source}
                      jiraIssues={jiraIssues}
                      slackMessages={slackMessages}
                      healthEntries={healthEntries}
                      members={members}
                      jiraDataSource={jiraDataSource}
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center gap-2">
              {insight.status === 'new' && (
                <>
                  <button
                    type="button"
                    onClick={() => onAddToActions(insight.id)}
                    className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    Add to Actions
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(insight.id)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                  >
                    Dismiss
                  </button>
                </>
              )}
              {insight.status === 'accepted' && (
                <StatusPill level="good" label="Sent to Actions" />
              )}
              {insight.status === 'dismissed' && (
                <StatusPill level="neutral" label="Dismissed" />
              )}
            </div>
          </li>
        )
      })}
      </ul>
    </div>
  )
}
