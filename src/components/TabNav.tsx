export function TabNav<TabId extends string>({
  tabs,
  activeId,
  onChange,
}: {
  tabs: readonly { id: TabId; label: string }[]
  activeId: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard sections"
      className="flex gap-1 border-b border-[var(--border)]"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-[var(--series-blue)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
