import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { JiraIssue, TeamMember, DeliveryGoal, JiraDataSource } from '../types'
import {
  getBlockedIssues,
  getStaleIssues,
  getHighWipDevelopers,
  getCycleTimeStats,
  getGoalProgress,
  getGoalHealth,
} from '../lib/delivery'
import { StatusPill } from './StatusPill'
import { TODAY } from '../lib/date'
import { getJiraStatus, normalizeJiraIssueKey } from '../lib/jira'

const STALE_THRESHOLD_DAYS = 5
const CYCLE_TIME_WINDOW_DAYS = 14

export function DeliveryRadar({
  issues,
  members,
  goal,
  onSetGoalText,
  onLinkIssue,
  onUnlinkIssue,
  onViewInsights,
  dataSource,
  projectKey,
  syncedAt,
  loading,
  error,
  onRefresh,
}: {
  issues: JiraIssue[]
  members: TeamMember[]
  goal: DeliveryGoal
  onSetGoalText: (text: string) => void
  onLinkIssue: (issueId: string) => void
  onUnlinkIssue: (issueId: string) => void
  onViewInsights?: () => void
  dataSource: JiraDataSource
  projectKey: string | null
  syncedAt: string | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState(goal.text)

  useEffect(() => {
    if (!editingGoal) setGoalDraft(goal.text)
  }, [goal.text, editingGoal])

  const referenceDate = dataSource === 'live' ? new Date() : TODAY
  const progress = getGoalProgress(goal, issues)
  const blocked = getBlockedIssues(issues, referenceDate)
  const stale = getStaleIssues(issues, STALE_THRESHOLD_DAYS, referenceDate)
  const goalHealth = getGoalHealth(progress, new Set(stale.map(({ issue }) => issue.id)))
  const highWip = getHighWipDevelopers(issues, members)
  const cycleTime = getCycleTimeStats(issues, CYCLE_TIME_WINDOW_DAYS, referenceDate)
  const crossTeamCount = issues.filter((i) => i.status === 'blocked' && i.crossTeamDependency).length

  function memberName(assigneeId: string): string {
    const issue = issues.find((candidate) => candidate.assigneeId === assigneeId)
    return issue?.assigneeName ?? members.find((m) => m.id === assigneeId)?.name ?? 'Unassigned'
  }

  function submitLink(e: FormEvent) {
    e.preventDefault()
    const id = normalizeJiraIssueKey(linkInput)
    if (!id) {
      setLinkError('Enter a Jira issue key to link.')
      return
    }
    if (goal.linkedIssueIds.includes(id)) {
      setLinkError(`${id} is already linked to this goal.`)
      return
    }
    if (!issues.some((i) => i.id === id)) {
      setLinkError(`No issue found with key “${id}” in the currently loaded Jira data.`)
      return
    }
    onLinkIssue(id)
    setLinkInput('')
    setLinkError(null)
    setLinkSuccess(`${id} linked to the delivery goal.`)
  }

  function saveGoal(e: FormEvent) {
    e.preventDefault()
    onSetGoalText(goalDraft.trim())
    setEditingGoal(false)
  }

  const healthLevel = {
    completed: 'good',
    blocked: 'critical',
    at_risk: 'warning',
    on_track: 'good',
    not_enough_data: 'neutral',
  }[goalHealth.level] as 'good' | 'critical' | 'warning' | 'neutral'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusPill
            level={dataSource === 'live' ? 'good' : 'neutral'}
            label={dataSource === 'live' ? `Live Jira · ${projectKey ?? ''}` : 'Demo Jira data'}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {loading
              ? 'Syncing…'
              : syncedAt
                ? `Last synced ${new Date(syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : 'Live Jira is unavailable; showing the demo dataset.'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-medium text-[var(--series-blue)] hover:underline disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && dataSource === 'demo' && (
        <p className="-mt-4 text-xs text-[var(--text-muted)]" role="status">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Current Delivery Goal</h2>
            {editingGoal ? (
              <form onSubmit={saveGoal} className="mt-3">
                <textarea
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  placeholder="What is this delivery window about?"
                  rows={2}
                  autoFocus
                  className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-2 text-sm text-[var(--text-primary)]"
                />
                <div className="mt-2 flex gap-2">
                  <button type="submit" className="rounded-md bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--surface-1)]">
                    Save goal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGoalDraft(goal.text)
                      setEditingGoal(false)
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className={`mt-2 text-sm ${goal.text ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {goal.text || 'No delivery goal has been defined yet.'}
              </p>
            )}
          </div>
          {!editingGoal && (
            <button
              type="button"
              onClick={() => setEditingGoal(true)}
              className="shrink-0 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            >
              {goal.text ? 'Edit goal' : 'Add goal'}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Goal health</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{goalHealth.explanation}</p>
          </div>
          <StatusPill level={healthLevel} label={goalHealth.label} />
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Linked issues</h3>
          {progress.items.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              No issues linked yet — link the tickets that make up this goal below.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border)]">
              {progress.items.map(({ issue }) => {
                const jiraStatus = getJiraStatus(issue)
                return (
                <li key={issue.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {issue.url ? (
                        <a href={issue.url} target="_blank" rel="noreferrer" className="font-medium text-[var(--series-blue)] hover:underline">{issue.id}</a>
                      ) : (
                        <span className="font-medium text-[var(--text-primary)]">{issue.id}</span>
                      )}
                      <StatusPill level={jiraStatus.level} label={jiraStatus.label} />
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{issue.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnlinkIssue(issue.id)}
                    aria-label={`Unlink ${issue.id}`}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Unlink
                  </button>
                </li>
              )})}
            </ul>
          )}

          {progress.totalCount > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-[var(--text-primary)]">{progress.percent}% complete</span>
                <span className="text-[var(--text-muted)]">{progress.doneCount} of {progress.totalCount} linked issues completed</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--page-plane)]" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Delivery goal progress">
                <div className="h-full rounded-full bg-[var(--status-good)] transition-[width]" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          <form onSubmit={submitLink} className="mt-3 flex gap-2">
            <input
              list="jira-issue-options"
              type="text"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value)
                setLinkError(null)
                setLinkSuccess(null)
              }}
              placeholder={`Link an issue or Jira URL, e.g. ${projectKey ?? 'TFP'}-2`}
              disabled={loading}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
            />
            <datalist id="jira-issue-options">
              {issues.filter((issue) => !goal.linkedIssueIds.includes(issue.id)).map((issue) => (
                <option key={issue.id} value={issue.id}>{issue.title}</option>
              ))}
            </datalist>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            >
              {loading ? 'Loading…' : 'Link'}
            </button>
          </form>
          {linkError && <p className="mt-1 text-xs text-[var(--status-critical)]">{linkError}</p>}
          {linkSuccess && <p className="mt-1 text-xs text-[var(--status-good)]" role="status">{linkSuccess}</p>}
          {!loading && issues.length === 0 && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">No Jira issues are currently available to link.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Median cycle time
        </h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          {cycleTime ? (
            <>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {cycleTime.currentMedian} days
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {cycleTime.percentChange === 0 ? (
                  'No change vs. previous 14 days'
                ) : (
                  <span
                    className={
                      cycleTime.percentChange > 0
                        ? 'text-[var(--status-critical)]'
                        : 'text-[var(--status-good)]'
                    }
                  >
                    {cycleTime.percentChange > 0 ? '↑' : '↓'} {Math.abs(cycleTime.percentChange)}%
                    compared to the previous 14 days
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Not enough completed work in the last 28 days to compute a trend yet.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          High Work In Progress
        </h2>
        {highWip.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No one is carrying an unusually high number of tickets right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {highWip.map(({ assigneeId, name, count }) => (
              <li
                key={assigneeId}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <span className="text-sm text-[var(--text-primary)]">{name}</span>
                <StatusPill level="critical" label={`${count} issues in progress`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Stale tickets
        </h2>
        {stale.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing has gone quiet for {STALE_THRESHOLD_DAYS} days or more.
          </p>
        ) : (
          <ul className="space-y-2">
            {stale.map(({ issue, daysBlocked }) => (
              <li
                key={issue.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <div className="min-w-0">
                  {issue.url ? (
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm text-[var(--series-blue)] hover:underline"
                    >
                      {issue.id} · {issue.title}
                    </a>
                  ) : (
                    <p className="truncate text-sm text-[var(--text-primary)]">
                      {issue.id} · {issue.title}
                    </p>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">{memberName(issue.assigneeId)}</p>
                </div>
                <StatusPill level="warning" label={`No activity in ${daysBlocked} days`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Blocked</h2>
        {blocked.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No blocked issues right now.</p>
        ) : (
          <ul className="space-y-2">
            {blocked.map(({ issue, daysBlocked }) => (
              <li
                key={issue.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-[var(--text-primary)]">
                    {issue.id} · {issue.title}
                  </p>
                  <StatusPill level="critical" label={`${daysBlocked} days`} />
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {issue.blockedReason} · {memberName(issue.assigneeId)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Risks</h2>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {blocked.length} blocked · {crossTeamCount} cross-team{' '}
            {crossTeamCount === 1 ? 'dependency' : 'dependencies'} · {stale.length} stale
          </p>
          {onViewInsights && (
            <button
              type="button"
              onClick={onViewInsights}
              className="shrink-0 text-xs text-[var(--series-blue)] hover:underline"
            >
              View related AI Insights
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
