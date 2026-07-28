import { useState } from 'react'
import { TeamHealthPulse } from './components/TeamHealthPulse'
import { DeliveryRadar } from './components/DeliveryRadar'
import { ActionTracker } from './components/ActionTracker'
import { TabNav } from './components/TabNav'
import {
  teamMembers,
  healthEntries,
  sprintStatus,
  actionItems,
} from './data/mockData'
import { TODAY, formatAsOf } from './lib/date'

const TABS = [
  {
    id: 'health',
    label: 'Team Health Pulse',
    description: 'Self-reported sentiment trend and current workload per person.',
  },
  {
    id: 'delivery',
    label: 'Delivery Radar',
    description: 'Current sprint progress, recent velocity, and open delivery risks.',
  },
  {
    id: 'tracker',
    label: '1:1s & Action Tracker',
    description: 'Upcoming 1:1s and open follow-ups, soonest first.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('health')
  const active = TABS.find((tab) => tab.id === activeTab)!

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Platform Team
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Engineering Manager Dashboard
          </p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          As of {formatAsOf(TODAY)}
        </p>
      </header>

      <TabNav tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <section
        role="tabpanel"
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--page-plane)] p-5"
      >
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {active.description}
        </p>

        {activeTab === 'health' && (
          <TeamHealthPulse members={teamMembers} entries={healthEntries} />
        )}
        {activeTab === 'delivery' && <DeliveryRadar sprint={sprintStatus} />}
        {activeTab === 'tracker' && (
          <ActionTracker items={actionItems} members={teamMembers} />
        )}
      </section>
    </div>
  )
}

export default App
