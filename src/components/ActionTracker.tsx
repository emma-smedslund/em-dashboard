import type { ActionItem, TeamMember } from '../types'
import { formatRelativeDue, daysFromToday, getActionStatus } from '../lib/date'
import { StatusPill } from './StatusPill'

const KIND_LABEL = {
  one_on_one: '1:1',
  follow_up: 'Follow-up',
}

export function ActionTracker({
  items,
  members,
}: {
  items: ActionItem[]
  members: TeamMember[]
}) {
  const sorted = [...items].sort(
    (a, b) => daysFromToday(a.dueDate) - daysFromToday(b.dueDate),
  )
  const memberById = new Map(members.map((m) => [m.id, m]))

  return (
    <ul className="space-y-2">
      {sorted.map((item) => {
        const member = memberById.get(item.memberId)
        const overdue = getActionStatus(item.dueDate) === 'overdue'

        return (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--text-primary)]">
                {item.title}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {KIND_LABEL[item.kind]}
                {member ? ` · ${member.name}` : ''}
              </p>
            </div>
            <StatusPill
              level={overdue ? 'critical' : 'neutral'}
              label={formatRelativeDue(item.dueDate)}
            />
          </li>
        )
      })}
    </ul>
  )
}
