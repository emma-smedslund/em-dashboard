import { useState } from 'react'
import type { FormEvent } from 'react'
import type { JiraIssue, TeamMember, DeliveryGoal } from '../types'
import {
  getBlockedIssues,
  getStaleIssues,
  getHighWipDevelopers,
  getCycleTimeStats,
  getGoalProgress,
} from '../lib/delivery'
import { StatusPill } from './StatusPill'

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
}: {
  issues: JiraIssue[]
  members: TeamMember[]
  goal: DeliveryGoal
  onSetGoalText: (text: string) => void
  onLinkIssue: (issueId: string) => void
  onUnlinkIssue: (issueId: string) => void
  onViewInsights?: () => void
}) {
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  const progress = getGoalProgress(goal, issues)
  const blocked = getBlockedIssues(issues)
  const stale = getStaleIssues(issues, STALE_THRESHOLD_DAYS)
  const highWip = getHighWipDevelopers(issues, members)
  const cycleTime = getCycleTimeStats(issues, CYCLE_TIME_WINDOW_DAYS)
  const crossTeamCount = issues.filter((i) => i.status === 'blocked' && i.crossTeamDependency).length

  function memberName(assigneeId: string): string {
    return members.find((m) => m.id === assigneeId)?.name ?? 'Unassigned'
  }

  function submitLink(e: FormEvent) {
    e.preventDefault()
    const id = linkInput.trim().toUpperCase()
    if (!id) return
    if (!issues.some((i) => i.id === id)) {
      setLinkError(`No issue found with id "${id}"`)
      return
    }
    onLinkIssue(id)
    setLinkInput('')
    setLinkError(null)
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Current Delivery Goal
        </h2>
        <input
          type="text"
          value={goal.text}
          onChange={(e) => onSetGoalText(e.target.value)}
          placeholder="What is this delivery window about?"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2 text-sm text-[var(--text-primary)]"
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Linked issues
        </h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          {progress.items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No issues linked yet — link the tickets that make up this goal below.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {progress.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span aria-hidden="true">{item.done ? '✔' : '○'}</span>
                    <span className="font-medium text-[var(--text-primary)]">{item.id}</span>
                    <span className="text-[var(--text-muted)]">{item.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnlinkIssue(item.id)}
                    aria-label={`Unlink ${item.id}`}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}

          {progress.totalCount > 0 && (
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              {progress.percent}% complete
            </p>
          )}

          <form onSubmit={submitLink} className="mt-3 flex gap-2">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value)
                setLinkError(null)
              }}
              placeholder="Link an issue, e.g. ENG-1188"
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            >
              Link
            </button>
          </form>
          {linkError && <p className="mt-1 text-xs text-[var(--status-critical)]">{linkError}</p>}
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
            {highWip.map(({ member, count }) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <span className="text-sm text-[var(--text-primary)]">{member.name}</span>
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
            Nothing has gone quiet for more than {STALE_THRESHOLD_DAYS} days.
          </p>
        ) : (
          <ul className="space-y-2">
            {stale.map(({ issue, daysBlocked }) => (
              <li
                key={issue.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--text-primary)]">
                    {issue.id} · {issue.title}
                  </p>
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
