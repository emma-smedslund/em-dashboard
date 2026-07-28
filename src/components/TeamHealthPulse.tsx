import type { HealthEntry, TeamMember } from '../types'
import { Sparkline } from './Sparkline'
import { StatusPill, type StatusLevel } from './StatusPill'

function workloadStatus(workload: number): { level: StatusLevel; label: string } {
  if (workload <= 2) return { level: 'good', label: 'Workload: light' }
  if (workload === 3) return { level: 'warning', label: 'Workload: steady' }
  return { level: 'critical', label: 'Workload: heavy' }
}

export function TeamHealthPulse({
  members,
  entries,
}: {
  members: TeamMember[]
  entries: HealthEntry[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const history = entries
          .filter((e) => e.memberId === member.id)
          .sort((a, b) => a.week.localeCompare(b.week))
        const latest = history[history.length - 1]
        const workload = workloadStatus(latest.workload)

        return (
          <div
            key={member.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--series-blue-track)] text-xs font-semibold text-[var(--series-blue)]">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {member.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {member.role}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Sparkline values={history.map((h) => h.sentiment)} />
              <span className="text-xs text-[var(--text-secondary)]">
                Sentiment {latest.sentiment}/5
              </span>
            </div>

            <div className="mt-3">
              <StatusPill level={workload.level} label={workload.label} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
