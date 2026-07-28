import { useState } from 'react'
import { TeamHealthPulse } from './components/TeamHealthPulse'
import { DeliveryRadar } from './components/DeliveryRadar'
import { ActionTracker } from './components/ActionTracker'
import { AIInsights } from './components/AIInsights'
import { Actions } from './components/Actions'
import { TabNav } from './components/TabNav'
import { useActions } from './hooks/useActions'
import { useDeliveryGoal } from './hooks/useDeliveryGoal'
import {
  teamMembers,
  healthEntries,
  actionItems,
  aiInsights,
  actionEntries,
  jiraIssues,
  slackMessages,
  deliveryGoalSeed,
} from './data/mockData'
import { TODAY, formatAsOf } from './lib/date'

const TABS = [
  {
    id: 'delivery',
    label: 'Delivery Radar',
    description: 'Operational delivery health: goal progress, flow, and where work is stuck.',
  },
  {
    id: 'insights',
    label: 'AI Insights',
    description: 'AI-surfaced risks worth your attention, ranked by confidence.',
  },
  {
    id: 'actions',
    label: 'Actions & Decisions Log',
    description: 'AI-suggested and manually added follow-ups, from proposal to completion.',
  },
  {
    id: 'health',
    label: 'Team Pulse',
    description: 'Self-reported sentiment trend and current workload per person.',
  },
  {
    id: 'tracker',
    label: "1:1's",
    description: 'Upcoming 1:1s and open follow-ups, soonest first.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('delivery')
  const active = TABS.find((tab) => tab.id === activeTab)!
  const {
    insights,
    actions,
    suggestActionFromInsight,
    dismissInsight,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  } = useActions(aiInsights, actionEntries)
  const { goal, setText, linkIssue, unlinkIssue } = useDeliveryGoal(deliveryGoalSeed)

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

        {activeTab === 'delivery' && (
          <DeliveryRadar
            issues={jiraIssues}
            members={teamMembers}
            goal={goal}
            onSetGoalText={setText}
            onLinkIssue={linkIssue}
            onUnlinkIssue={unlinkIssue}
            onViewInsights={() => setActiveTab('insights')}
          />
        )}
        {activeTab === 'insights' && (
          <AIInsights
            insights={insights}
            jiraIssues={jiraIssues}
            slackMessages={slackMessages}
            healthEntries={healthEntries}
            members={teamMembers}
            onAddToActions={suggestActionFromInsight}
            onDismiss={dismissInsight}
          />
        )}
        {activeTab === 'actions' && (
          <Actions
            actions={actions}
            members={teamMembers}
            onAcceptAction={acceptAction}
            onDismissAction={dismissAction}
            onCompleteAction={completeAction}
            onAddManualAction={addManualAction}
            onViewInsight={() => setActiveTab('insights')}
          />
        )}
        {activeTab === 'health' && (
          <TeamHealthPulse members={teamMembers} entries={healthEntries} />
        )}
        {activeTab === 'tracker' && (
          <ActionTracker items={actionItems} members={teamMembers} />
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Demo data is used to illustrate how signals from engineering tools can be
        consolidated and translated into actionable leadership insights.
      </footer>

      {confirmation && (
        <div
          role="status"
          className="fixed bottom-4 right-4 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg"
        >
          {confirmation}
          <button
            type="button"
            onClick={clearConfirmation}
            aria-label="Dismiss confirmation"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  )
}

export default App
