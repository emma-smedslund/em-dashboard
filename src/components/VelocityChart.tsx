import type { VelocityPoint } from '../types'
import { StatusPill } from './StatusPill'

function statusFor(ratio: number) {
  if (ratio >= 0.9) return { level: 'good' as const, var: 'var(--status-good)' }
  if (ratio >= 0.7)
    return { level: 'warning' as const, var: 'var(--status-warning)' }
  return { level: 'critical' as const, var: 'var(--status-critical)' }
}

export function VelocityChart({
  history,
  inProgressSprint,
}: {
  history: VelocityPoint[]
  inProgressSprint?: string
}) {
  const scaleMax =
    Math.ceil(Math.max(...history.map((h) => h.committedPoints)) / 10) * 10

  return (
    <div>
      <div className="flex h-36 items-end gap-3">
        {history.map((point) => {
          const isInProgress = point.sprint === inProgressSprint
          const ratio = point.completedPoints / point.committedPoints
          const color = isInProgress ? 'var(--series-blue)' : statusFor(ratio).var
          const barPct = (point.completedPoints / scaleMax) * 100
          const targetPct = (point.committedPoints / scaleMax) * 100

          return (
            <div
              key={point.sprint}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="mb-1 text-xs font-semibold text-[var(--text-primary)]">
                {point.completedPoints}
                {isInProgress ? ' *' : ''}
              </span>
              <div
                className="w-6 rounded-t"
                style={{ height: `${barPct}%`, background: color }}
              />
              <div
                className="absolute w-8 border-t border-dashed"
                style={{
                  bottom: `${targetPct}%`,
                  borderColor: 'var(--baseline)',
                }}
                aria-hidden="true"
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {history.map((point) => (
          <div
            key={point.sprint}
            className="flex-1 text-center text-xs text-[var(--text-muted)]"
          >
            {point.sprint.replace('Sprint ', 'S')}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <StatusPill level="good" label="On track (≥90%)" />
        <StatusPill level="warning" label="At risk (70–89%)" />
        <StatusPill level="critical" label="Behind (<70%)" />
        {inProgressSprint && <StatusPill level="neutral" label="In progress *" />}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Dashed tick marks the committed target for each sprint.
        {inProgressSprint &&
          ' * Sprint still open — completion ratio isn’t final yet.'}
      </p>
    </div>
  )
}
