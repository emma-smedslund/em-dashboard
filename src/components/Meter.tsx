export function Meter({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {value}/{max} pts · {pct}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--series-blue-track)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'var(--series-blue)' }}
        />
      </div>
    </div>
  )
}
