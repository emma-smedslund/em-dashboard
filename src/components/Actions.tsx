import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ActionEntry, ActionPriority, TeamMember } from '../types'
import { formatRelativeDue, daysFromToday } from '../lib/date'
import { StatusPill, type StatusLevel } from './StatusPill'

const PRIORITY_PILL: Record<ActionPriority, { level: StatusLevel; label: string }> = {
  high: { level: 'critical', label: 'High priority' },
  medium: { level: 'warning', label: 'Medium priority' },
  low: { level: 'neutral', label: 'Low priority' },
}

const SOURCE_PILL: Record<ActionEntry['source'], { level: StatusLevel; label: string }> = {
  ai: { level: 'good', label: 'AI suggested' },
  manual: { level: 'neutral', label: 'Added by you' },
}

const EMPTY_MANUAL_FORM = {
  title: '',
  owner: '',
  dueDate: '',
  priority: 'medium' as ActionPriority,
  context: '',
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

export function Actions({
  actions,
  members,
  onAcceptAction,
  onDismissAction,
  onCompleteAction,
  onAddManualAction,
  onViewInsight,
}: {
  actions: ActionEntry[]
  members: TeamMember[]
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
  }) => void
  onViewInsight?: (insightId: string) => void
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
    })
    setManualForm(EMPTY_MANUAL_FORM)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 text-xs text-[var(--text-secondary)]">
        AI can surface suggested actions from patterns it detects across the team, but it
        never assigns an owner, sets a due date, or closes anything on its own. Every
        suggestion waits below until you accept or dismiss it.
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Suggested by AI {suggested.length > 0 && `(${suggested.length})`}
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
                  <StatusPill
                    level={PRIORITY_PILL[action.priority].level}
                    label={PRIORITY_PILL[action.priority].label}
                  />
                </div>

                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{action.context}</p>

                {action.sourceInsightTitle && (
                  <button
                    type="button"
                    onClick={() => action.sourceInsightId && onViewInsight?.(action.sourceInsightId)}
                    className="mt-1 text-xs text-[var(--series-blue)] hover:underline"
                  >
                    From AI insight: {action.sourceInsightTitle}
                  </button>
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
                      level={SOURCE_PILL[action.source].level}
                      label={SOURCE_PILL[action.source].label}
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

                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {action.owner ?? 'Unassigned'} ·{' '}
                  {action.dueDate ? formatRelativeDue(action.dueDate) : 'No due date'}
                </p>

                {action.sourceInsightTitle && (
                  <button
                    type="button"
                    onClick={() => action.sourceInsightId && onViewInsight?.(action.sourceInsightId)}
                    className="mt-1 text-xs text-[var(--series-blue)] hover:underline"
                  >
                    From AI insight: {action.sourceInsightTitle}
                  </button>
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
