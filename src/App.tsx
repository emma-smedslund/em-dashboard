import { TeamHealthPulse } from './components/TeamHealthPulse'
import { DeliveryRadar } from './components/DeliveryRadar'
import { ActionTracker } from './components/ActionTracker'
import {
  teamMembers,
  healthEntries,
  sprintStatus,
  actionItems,
} from './data/mockData'
import { TODAY, formatAsOf } from './lib/date'

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--page-plane)] p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">{description}</p>
      {children}
    </section>
  )
}

function App() {
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

      <div className="space-y-6">
        <SectionCard
          title="Team Health Pulse"
          description="Self-reported sentiment trend and current workload per person."
        >
          <TeamHealthPulse members={teamMembers} entries={healthEntries} />
        </SectionCard>

        <SectionCard
          title="Delivery Radar"
          description="Current sprint progress, recent velocity, and open delivery risks."
        >
          <DeliveryRadar sprint={sprintStatus} />
        </SectionCard>

        <SectionCard
          title="1:1s & Action Tracker"
          description="Upcoming 1:1s and open follow-ups, soonest first."
        >
          <ActionTracker items={actionItems} members={teamMembers} />
        </SectionCard>
      </div>
    </div>
  )
}

export default App
