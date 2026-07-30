import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  ActionEntry,
  ActionPriority,
  JiraDataSource,
  JiraIssue,
  TeamMember,
} from '../types'
import { formatRelativeDue, daysFromToday } from '../lib/date'
import { getJiraStatus } from '../lib/jira'
import { StatusPill, type StatusLevel } from './StatusPill'

const PRIORITY_PILL: Record<ActionPriority, { level: StatusLevel; label: string }> = {
  high: { level: 'critical', label: 'High priority' },
  medium: { level: 'warning', label: 'Medium priority' },
  low: { level: 'neutral', label: 'Low priority' },
}

function getActionSourcePill(action: ActionEntry, jiraDataSource: JiraDataSource) {
  if (action.source === 'manual') return { level: 'neutral' as const, label: 'Added by you' }
  if (action.source === 'signal') {
    return {
      level: action.sourceDataMode === 'live' ? ('good' as const) : ('neutral' as const),
      label: `Team signal · ${action.sourceDataMode === 'live' ? 'Live data' : 'Demo data'}`,
    }
  }
  if ((action.linkedJiraIssueIds?.length ?? 0) > 0) {
    return {
      level: jiraDataSource === 'live' ? ('good' as const) : ('neutral' as const),
      label: jiraDataSource === 'live' ? 'Suggested follow-up · Live Jira' : 'Suggested follow-up · Demo Jira',
    }
  }
  return { level: 'neutral' as const, label: 'Suggested follow-up · Demo data' }
}

const EMPTY_MANUAL_FORM = {
  title: '',
  owner: '',
  dueDate: '',
  priority: 'medium' as ActionPriority,
  context: '',
  linkedJiraIssueId: '',
}

function OwnerOptions({ members }: { members: TeamMember[] }) {
  return (
    <>
      <option value="">Unassigned</option>
      <option value="Me">Me</option>
      {members.map((m) => (
        <option key={m.id} value={m.name}>
          {m.name}
        </option>
      ))}
    </>
  )
}

function LinkedJiraIssues({
  action,
  jiraIssues,
  jiraDataSource,
}: {
  action: ActionEntry
  jiraIssues: JiraIssue[]
  jiraDataSource: JiraDataSource
}) {
  const linkedIds = action.linkedJiraIssueIds ?? []
  if (linkedIds.length === 0) return null

  return (
    <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {jiraDataSource === 'live' ? 'Live Jira issues' : 'Linked Jira issues · demo data'}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {linkedIds.map((id) => {
          const issue = jiraIssues.find((candidate) => candidate.id === id)
          if (!issue) {
            return (
              <li key={id} className="text-xs text-[var(--text-muted)]">
                {id} · Not available in the currently loaded Jira data
              </li>
            )
          }
          const status = getJiraStatus(issue)
          return (
            <li key={id} className="flex flex-wrap items-center justify-between gap-2">
              {issue.url ? (
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-xs font-medium text-[var(--series-blue)] hover:underline"
                >
                  {issue.id} · {issue.title}
                </a>
              ) : (
                <span className="min-w-0 truncate text-xs text-[var(--text-primary)]">
                  {issue.id} · {issue.title}
                </span>
              )}
              <StatusPill level={status.level} label={status.label} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Actions({
  actions,
  members,
  jiraIssues,
  jiraDataSource,
  projectKey,
  syncedAt,
  loadingJira,
  jiraError,
  onRefreshJira,
  onAcceptAction,
  onDismissAction,
  onCompleteAction,
  onAddManualAction,
}: {
  actions: ActionEntry[]
  members: TeamMember[]
  jiraIssues: JiraIssue[]
  jiraDataSource: JiraDataSource
  projectKey: string | null
  syncedAt: string | null
  loadingJira: boolean
  jiraError: string | null
  onRefreshJira: () => void
  onAcceptAction: (
    id: string,
    details: { owner: string | null; dueDate: string | null; priority: ActionPriority },
  ) => void
  onDismissAction: (id: string) => void
  onCompleteAction: (id: string) => void
  onAddManualAction: (input: {
    title: string
    owner: string | null
    dueDate: string | null
    priority: ActionPriority
    context: string
    linkedJiraIssueId: string | null
  }) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptForm, setAcceptForm] = useState({
    owner: '',
    dueDate: '',
    priority: 'medium' as ActionPriority,
  })

  const suggested = actions.filter((a) => a.status === 'suggested')
  const active = [...actions.filter((a) => a.status === 'active')].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return daysFromToday(a.dueDate) - daysFromToday(b.dueDate)
  })
  const resolved = actions.filter((a) => a.status === 'completed' || a.status === 'dismissed')
  const decisions = actions
    .filter((action) => action.status !== 'suggested')
    .sort((a, b) =>
      (b.decisionDate ?? b.completedDate ?? b.createdDate)
        .localeCompare(a.decisionDate ?? a.completedDate ?? a.createdDate),
    )

  function startAccept(action: ActionEntry) {
    setAcceptingId(action.id)
    setAcceptForm({
      owner: action.owner ?? '',
      dueDate: action.dueDate ?? '',
      priority: action.priority,
    })
  }

  function confirmAccept(actionId: string) {
    onAcceptAction(actionId, {
      owner: acceptForm.owner || null,
      dueDate: acceptForm.dueDate || null,
      priority: acceptForm.priority,
    })
    setAcceptingId(null)
  }

  function submitManualAction(e: FormEvent) {
    e.preventDefault()
    if (!manualForm.title.trim()) return
    onAddManualAction({
      title: manualForm.title.trim(),
      owner: manualForm.owner || null,
      dueDate: manualForm.dueDate || null,
      priority: manualForm.priority,
      context: manualForm.context.trim(),
      linkedJiraIssueId: manualForm.linkedJiraIssueId || null,
    })
    setManualForm(EMPTY_MANUAL_FORM)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            level={jiraDataSource === 'live' ? 'good' : 'neutral'}
            label={jiraDataSource === 'live' ? `Live Jira · ${projectKey ?? ''}` : 'Demo Jira data'}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {loadingJira
              ? 'Syncing Jira statuses…'
              : jiraDataSource === 'live' && syncedAt
                ? `Issue statuses synced ${new Date(syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : jiraError ?? 'Live Jira is unavailable.'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRefreshJira}
          disabled={loadingJira}
          className="text-xs font-medium text-[var(--series-blue)] hover:underline disabled:opacity-50"
        >
          {loadingJira ? 'Refreshing…' : 'Refresh Jira'}
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 text-xs text-[var(--text-secondary)]">
        Pattern detection can surface suggested actions, but it never assigns an owner,
        sets a due date, or closes anything on its own. Every suggestion waits below until
        the Engineering Manager accepts or dismisses it.
      </div>

      <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
          Decisions Log ({decisions.length})
        </summary>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          A lightweight record of decisions made by the Engineering Manager.
        </p>
        {decisions.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {decisions.slice(0, 8).map((action) => (
              <li key={`decision-${action.id}`} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)]">{action.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {action.status === 'active'
                      ? `Accepted${action.owner ? ` · Owner: ${action.owner}` : ''}`
                      : action.status === 'completed'
                        ? 'Completed'
                        : 'Dismissed or archived'}
                    {' · '}{action.decisionDate ?? action.completedDate ?? action.createdDate}
                  </p>
                </div>
                <StatusPill
                  level={action.status === 'completed' ? 'good' : action.status === 'active' ? 'warning' : 'neutral'}
                  label={action.source === 'manual' ? 'Manual decision' : 'Signal follow-up'}
                />
              </li>
            ))}
          </ul>
        )}
      </details>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Suggested follow-ups {suggested.length > 0 && `(${suggested.length})`}
        </h2>
        {suggested.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No pending suggestions.</p>
        ) : (
          <ul className="space-y-3">
            {suggested.map((action) => (
              <li
                key={action.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {action.title}
                  </h3>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <StatusPill
                      level={getActionSourcePill(action, jiraDataSource).level}
                      label={getActionSourcePill(action, jiraDataSource).label}
                    />
                    <StatusPill
                      level={PRIORITY_PILL[action.priority].level}
                      label={PRIORITY_PILL[action.priority].label}
                    />
                  </div>
                </div>

                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{action.context}</p>

                <LinkedJiraIssues
                  action={action}
                  jiraIssues={jiraIssues}
                  jiraDataSource={jiraDataSource}
                />

                {action.sourceInsightTitle && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    From earlier interpreted signal: {action.sourceInsightTitle}
                  </p>
                )}
                {action.sourceSignalTitle && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    From Team Signal: {action.sourceSignalTitle}
                  </p>
                )}

                {acceptingId === action.id ? (
                  <div className="mt-3 space-y-2 rounded-md border border-[var(--border)] p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label className="text-xs text-[var(--text-muted)]">
                        Owner
                        <select
                          value={acceptForm.owner}
                          onChange={(e) =>
                            setAcceptForm((f) => ({ ...f, owner: e.target.value }))
                          }
                          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
                        >
                          <OwnerOptions members={members} />
                        </select>
                      </label>
                      <label className="text-xs text-[var(--text-muted)]">
                        Due date
                        <input
                          type="date"
                          value={acceptForm.dueDate}
                          onChange={(e) =>
                            setAcceptForm((f) => ({ ...f, dueDate: e.target.value }))
                          }
                          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                      <label className="text-xs text-[var(--text-muted)]">
                        Priority
                        <select
                          value={acceptForm.priority}
                          onChange={(e) =>
                            setAcceptForm((f) => ({
                              ...f,
                              priority: e.target.value as ActionPriority,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmAccept(action.id)}
                        className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                      >
                        Confirm accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcceptingId(null)}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startAccept(action)}
                      className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissAction(action.id)}
                      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Active ({active.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
          >
            {showAddForm ? 'Cancel' : '+ Add action'}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={submitManualAction}
            className="mb-3 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <input
              type="text"
              required
              placeholder="Action title"
              value={manualForm.title}
              onChange={(e) => setManualForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
            />
            <textarea
              placeholder="Short context (optional)"
              value={manualForm.context}
              onChange={(e) => setManualForm((f) => ({ ...f, context: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
            />
            <label className="block text-xs text-[var(--text-muted)]">
              Linked Jira issue (optional)
              <select
                value={manualForm.linkedJiraIssueId}
                onChange={(e) =>
                  setManualForm((form) => ({ ...form, linkedJiraIssueId: e.target.value }))
                }
                disabled={loadingJira || jiraIssues.length === 0}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)] disabled:opacity-50"
              >
                <option value="">No Jira issue linked</option>
                {jiraIssues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.id} · {issue.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={manualForm.owner}
                onChange={(e) => setManualForm((f) => ({ ...f, owner: e.target.value }))}
                className="rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
              >
                <OwnerOptions members={members} />
              </select>
              <input
                type="date"
                value={manualForm.dueDate}
                onChange={(e) => setManualForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
              />
              <select
                value={manualForm.priority}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, priority: e.target.value as ActionPriority }))
                }
                className="rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Add action
            </button>
          </form>
        )}

        {active.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No active actions.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((action) => (
              <li
                key={action.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {action.title}
                  </h3>
                  <div className="flex shrink-0 gap-1.5">
                    <StatusPill
                      level={getActionSourcePill(action, jiraDataSource).level}
                      label={getActionSourcePill(action, jiraDataSource).label}
                    />
                    <StatusPill
                      level={PRIORITY_PILL[action.priority].level}
                      label={PRIORITY_PILL[action.priority].label}
                    />
                  </div>
                </div>

                {action.context && (
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{action.context}</p>
                )}

                <LinkedJiraIssues
                  action={action}
                  jiraIssues={jiraIssues}
                  jiraDataSource={jiraDataSource}
                />

                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {action.owner ?? 'Unassigned'} ·{' '}
                  {action.dueDate ? formatRelativeDue(action.dueDate) : 'No due date'}
                </p>

                {action.sourceInsightTitle && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    From earlier interpreted signal: {action.sourceInsightTitle}
                  </p>
                )}
                {action.sourceSignalTitle && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    From Team Signal: {action.sourceSignalTitle}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCompleteAction(action.id)}
                    className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    Mark complete
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissAction(action.id)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                  >
                    Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Completed &amp; archived ({resolved.length})
        </h2>
        {resolved.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nothing here yet.</p>
        ) : (
          <ul className="space-y-2">
            {resolved.map((action) => (
              <li
                key={action.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 opacity-70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--text-primary)]">{action.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {action.owner ?? 'Unassigned'}
                    {action.completedDate ? ` · Completed ${action.completedDate}` : ''}
                  </p>
                  {(action.linkedJiraIssueIds?.length ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Jira: {action.linkedJiraIssueIds?.map((id) => {
                        const issue = jiraIssues.find((candidate) => candidate.id === id)
                        return issue ? `${id} · ${getJiraStatus(issue).label}` : id
                      }).join(', ')}
                    </p>
                  )}
                </div>
                <StatusPill
                  level={action.status === 'completed' ? 'good' : 'neutral'}
                  label={action.status === 'completed' ? 'Completed' : 'Dismissed'}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
