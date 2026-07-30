type StatusLevel = 'good' | 'warning' | 'serious' | 'critical' | 'neutral'

const DOT_COLOR: Record<StatusLevel, string> = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
  neutral: 'var(--text-muted)',
}

export function StatusPill({
  level,
  label,
}: {
  level: StatusLevel
  label: string
}) {
  return (
    <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: DOT_COLOR[level] }}
        aria-hidden="true"
      />
      <span className="min-w-0 break-words">{label}</span>
    </span>
  )
}

export type { StatusLevel }
