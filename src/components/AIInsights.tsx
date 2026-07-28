import type { AIInsight } from '../types'
import { StatusPill } from './StatusPill'

const CONFIDENCE_PILL = {
  high: { level: 'good' as const, label: 'High confidence' },
  medium: { level: 'warning' as const, label: 'Medium confidence' },
  low: { level: 'neutral' as const, label: 'Low confidence' },
}

export function AIInsights({
  insights,
  onAddToActions,
  onDismiss,
}: {
  insights: AIInsight[]
  onAddToActions: (insightId: string) => void
  onDismiss: (insightId: string) => void
}) {
  return (
    <ul className="space-y-3">
      {insights.map((insight) => {
        const confidence = CONFIDENCE_PILL[insight.confidence]

        return (
          <li
            key={insight.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {insight.title}
              </h3>
              <StatusPill level={confidence.level} label={confidence.label} />
            </div>

            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {insight.summary}
            </p>

            <ul className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
              {insight.rationale.map((line, i) => (
                <li key={i} className="flex gap-1.5">
                  <span aria-hidden="true">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

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
  )
}
