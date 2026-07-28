import type { SprintStatus } from '../types'
import { Meter } from './Meter'
import { VelocityChart } from './VelocityChart'
import { StatusPill } from './StatusPill'

const SEVERITY_PILL = {
  high: { level: 'critical' as const, label: 'High' },
  medium: { level: 'warning' as const, label: 'Medium' },
  low: { level: 'neutral' as const, label: 'Low' },
}

export function DeliveryRadar({ sprint }: { sprint: SprintStatus }) {
  return (
    <div className="space-y-6">
      <Meter
        value={sprint.completedPoints}
        max={sprint.totalPoints}
        label={sprint.name}
      />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Velocity, last 4 sprints
        </h3>
        <VelocityChart
          history={sprint.velocityHistory}
          inProgressSprint={sprint.name}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Risks
        </h3>
        <ul className="space-y-2">
          {sprint.risks.map((risk) => {
            const pill = SEVERITY_PILL[risk.severity]
            return (
              <li
                key={risk.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  {risk.description}
                </p>
                <StatusPill level={pill.level} label={pill.label} />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
