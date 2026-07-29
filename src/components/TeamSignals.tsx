import { useState } from 'react'
import type {
  JiraIssue,
  TeamSignal,
  TeamSignalCategory,
  TeamSignalSeverity,
  TeamSignalSource,
  TeamSignalStatus,
} from '../types'
import {
  TEAM_SIGNAL_CATEGORIES,
  TEAM_SIGNAL_SEVERITIES,
  TEAM_SIGNAL_SOURCES,
  TEAM_SIGNAL_STATUSES,
} from '../types'
import { StatusPill, type StatusLevel } from './StatusPill'

const SEVERITY_PILL: Record<TeamSignalSeverity, { level: StatusLevel; label: string }> = {
  Info: { level: 'neutral', label: 'Info' },
  Watch: { level: 'warning', label: 'Watch' },
  Attention: { level: 'serious', label: 'Attention' },
}

const STATUS_PILL: Record<TeamSignalStatus, StatusLevel> = {
  New: 'warning',
  Acknowledged: 'neutral',
  Monitoring: 'good',
  Resolved: 'neutral',
}

type FilterValue<T extends string> = T | 'All'

export function TeamSignals({
  signals,
  jiraIssues,
  onCreateAction,
  onSetStatus,
}: {
  signals: TeamSignal[]
  jiraIssues: JiraIssue[]
  onCreateAction: (signal: TeamSignal) => void
  onSetStatus: (id: string, status: TeamSignalStatus) => void
}) {
  const [category, setCategory] = useState<FilterValue<TeamSignalCategory>>('All')
  const [severity, setSeverity] = useState<FilterValue<TeamSignalSeverity>>('All')
  const [source, setSource] = useState<FilterValue<TeamSignalSource>>('All')
  const [status, setStatus] = useState<FilterValue<TeamSignalStatus>>('All')

  const visibleSignals = signals.filter(
    (signal) =>
      (category === 'All' || signal.category === category) &&
      (severity === 'All' || signal.severity === severity) &&
      (source === 'All' || signal.source === source) &&
      (status === 'All' || signal.status === status),
  )

  function updateStatus(id: string, nextStatus: TeamSignalStatus) {
    onSetStatus(id, nextStatus)
  }

  function createAction(signal: TeamSignal) {
    onCreateAction(signal)
    updateStatus(signal.id, 'Acknowledged')
  }

  const counts = TEAM_SIGNAL_STATUSES.map((signalStatus) => ({
    status: signalStatus,
    count: signals.filter((signal) => signal.status === signalStatus).length,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Team Signals</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Emerging patterns from delivery, quality, collaboration, and improvement work.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(({ status: signalStatus, count }) => (
          <div key={signalStatus} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
            <p className="text-xl font-semibold text-[var(--text-primary)]">{count}</p>
            <p className="text-xs text-[var(--text-muted)]">{signalStatus}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 sm:grid-cols-4">
        <SignalFilter label="Category" value={category} onChange={setCategory} options={TEAM_SIGNAL_CATEGORIES} />
        <SignalFilter label="Severity" value={severity} onChange={setSeverity} options={TEAM_SIGNAL_SEVERITIES} />
        <SignalFilter label="Source" value={source} onChange={setSource} options={TEAM_SIGNAL_SOURCES} />
        <SignalFilter label="Status" value={status} onChange={setStatus} options={TEAM_SIGNAL_STATUSES} />
      </div>

      {visibleSignals.length === 0 ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text-muted)]">
          No significant signals detected for the selected period and filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleSignals.map((signal) => (
            <li key={signal.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {signal.category}
                  </p>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{signal.title}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusPill level={SEVERITY_PILL[signal.severity].level} label={SEVERITY_PILL[signal.severity].label} />
                  <StatusPill level={STATUS_PILL[signal.status]} label={signal.status} />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Derived pattern</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{signal.summary}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Observed data</p>
                  <ul className="mt-1 space-y-1">
                    {signal.evidence.map((item, index) => {
                      const jiraIssue = item.refId ? jiraIssues.find((issue) => issue.id === item.refId) : undefined
                      return (
                        <li key={`${signal.id}-evidence-${index}`} className="text-xs text-[var(--text-secondary)]">
                          {jiraIssue?.url ? (
                            <a href={jiraIssue.url} target="_blank" rel="noreferrer" className="text-[var(--series-blue)] hover:underline">
                              {item.label}
                            </a>
                          ) : item.label}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <span>{signal.source} · {signal.sourceMode === 'live' ? 'Live data' : 'Demo data'}</span>
                <span>{signal.timeRange}</span>
                <span>Detected {signal.detectedAt}</span>
              </div>

              {signal.suggestedFollowUp && (
                <div className="mt-3 rounded-md bg-[var(--page-plane)] p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Suggested follow-up</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{signal.suggestedFollowUp}</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {signal.status !== 'Resolved' && (
                  <>
                    <button type="button" onClick={() => createAction(signal)} className="rounded-md bg-[var(--series-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                      Create action
                    </button>
                    {signal.status === 'New' && (
                      <button type="button" onClick={() => updateStatus(signal.id, 'Acknowledged')} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]">
                        Acknowledge
                      </button>
                    )}
                    {signal.status !== 'Monitoring' && (
                      <button type="button" onClick={() => updateStatus(signal.id, 'Monitoring')} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]">
                        Monitor
                      </button>
                    )}
                    <button type="button" onClick={() => updateStatus(signal.id, 'Resolved')} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]">
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SignalFilter<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: FilterValue<T>
  onChange: (value: FilterValue<T>) => void
  options: readonly T[]
}) {
  return (
    <label className="text-xs text-[var(--text-muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as FilterValue<T>)}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--page-plane)] p-1.5 text-sm text-[var(--text-primary)]"
      >
        <option value="All">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
