import { useMemo, useState } from 'react'
import { TeamSignals } from './components/TeamSignals'
import { DeliveryRadar } from './components/DeliveryRadar'
import { AIInsights } from './components/AIInsights'
import { Actions } from './components/Actions'
import { TabNav } from './components/TabNav'
import { useActions } from './hooks/useActions'
import { useDeliveryGoal } from './hooks/useDeliveryGoal'
import { useJiraIssues } from './hooks/useJiraIssues'
import {
  teamMembers,
  aiInsights,
  actionEntries,
  jiraIssues as demoJiraIssues,
  slackMessages,
  deliveryGoalSeed,
} from './data/mockData'
import { formatAsOf, TODAY } from './lib/date'
import { generateJiraInsights } from './lib/jiraInsights'
import { detectTeamSignals } from './lib/teamSignals'
import { pullRequestPeriodMetrics, retrospectiveActionPoints } from './data/teamSignalData'
import { useTeamSignals } from './hooks/useTeamSignals'

const TABS = [
  {
    id: 'delivery',
    label: 'Delivery Radar',
    description: 'Operational delivery health: goal progress, flow, and where work is stuck.',
  },
  {
    id: 'actions',
    label: 'Actions & Decisions Log',
    description: 'AI-suggested and manually added follow-ups, from proposal to completion.',
  },
  {
    id: 'signals',
    label: 'Team Signals',
    description: 'Emerging patterns worth reviewing before they become larger problems.',
  },
  {
    id: 'insights',
    label: 'AI Insights',
    description: 'Broader interpretation across multiple engineering signals and sources.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

const DEMO_INSIGHTS = aiInsights.filter(
  (insight) => !insight.sources.some((source) => source.type === 'jira'),
)

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('delivery')
  const active = TABS.find((tab) => tab.id === activeTab)!
  const { goal, setText, linkIssue, unlinkIssue } = useDeliveryGoal(deliveryGoalSeed)
  const jira = useJiraIssues(demoJiraIssues)
  const generatedJiraInsights = useMemo(
    () => generateJiraInsights(jira.issues, jira.source === 'live' ? new Date() : TODAY),
    [jira.issues, jira.source],
  )
  const insightSeed = useMemo(
    () => [...generatedJiraInsights, ...DEMO_INSIGHTS],
    [generatedJiraInsights],
  )
  const detectedTeamSignals = useMemo(
    () => detectTeamSignals({
      jiraIssues: jira.issues,
      jiraDataSource: jira.source,
      slackMessages,
      pullRequestMetrics: pullRequestPeriodMetrics,
      retrospectiveActions: retrospectiveActionPoints,
      referenceDate: jira.source === 'live' ? new Date() : TODAY,
    }),
    [jira.issues, jira.source],
  )
  const { signals: teamSignals, setSignalStatus } = useTeamSignals(detectedTeamSignals)
  const {
    insights,
    actions,
    suggestActionFromInsight,
    suggestActionFromSignal,
    dismissInsight,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  } = useActions(insightSeed, actionEntries)

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
          As of {formatAsOf(new Date())}
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
            issues={jira.issues}
            members={teamMembers}
            goal={goal}
            onSetGoalText={setText}
            onLinkIssue={linkIssue}
            onUnlinkIssue={unlinkIssue}
            onViewInsights={() => setActiveTab('insights')}
            dataSource={jira.source}
            projectKey={jira.projectKey}
            syncedAt={jira.syncedAt}
            loading={jira.loading}
            error={jira.error}
            onRefresh={jira.refresh}
          />
        )}
        {activeTab === 'insights' && (
          <AIInsights
            insights={insights}
            jiraIssues={jira.issues}
            slackMessages={slackMessages}
            members={teamMembers}
            jiraDataSource={jira.source}
            projectKey={jira.projectKey}
            syncedAt={jira.syncedAt}
            loading={jira.loading}
            error={jira.error}
            jiraInsightCount={generatedJiraInsights.length}
            onRefreshJira={jira.refresh}
            onAddToActions={suggestActionFromInsight}
            onDismiss={dismissInsight}
          />
        )}
        {activeTab === 'actions' && (
          <Actions
            actions={actions}
            members={teamMembers}
            jiraIssues={jira.issues}
            jiraDataSource={jira.source}
            projectKey={jira.projectKey}
            syncedAt={jira.syncedAt}
            loadingJira={jira.loading}
            jiraError={jira.error}
            onRefreshJira={jira.refresh}
            onAcceptAction={acceptAction}
            onDismissAction={dismissAction}
            onCompleteAction={completeAction}
            onAddManualAction={addManualAction}
            onViewInsight={() => setActiveTab('insights')}
          />
        )}
        {activeTab === 'signals' && (
          <TeamSignals
            signals={teamSignals}
            jiraIssues={jira.issues}
            onCreateAction={suggestActionFromSignal}
            onSetStatus={setSignalStatus}
          />
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Some demo data is used to illustrate how signals from engineering tools can be
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
