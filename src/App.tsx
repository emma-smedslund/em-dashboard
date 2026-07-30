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
import { DEMO_REFERENCE_DATE, formatAsOf } from './lib/date'
import { generateJiraInsights } from './lib/jiraInsights'
import { detectTeamSignals } from './lib/teamSignals'
import { pullRequestPeriodMetrics, retrospectiveActionPoints } from './data/teamSignalData'
import { useTeamSignals } from './hooks/useTeamSignals'
import { useSlackMessages } from './hooks/useSlackMessages'
import { generateSlackInsights } from './lib/slackInsights'

const TABS = [
  {
    id: 'delivery',
    label: 'Delivery Radar',
    description: 'Operational delivery health: goal progress, flow, and where work is stuck.',
  },
  {
    id: 'signals',
    label: 'Team Signals',
    description: 'Emerging patterns worth reviewing before they become larger problems.',
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'AI-suggested and manually added follow-ups, from proposal to completion.',
  },
  {
    id: 'insights',
    label: 'AI Insights',
    description: 'Broader interpretation across multiple engineering signals and sources.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

const NON_JIRA_DEMO_INSIGHTS = aiInsights.filter(
  (insight) => !insight.sources.some((source) => source.type === 'jira'),
)
const DELIVERY_DEMO_INSIGHTS = NON_JIRA_DEMO_INSIGHTS.filter(
  (insight) => !insight.sources.some((source) => source.type === 'slack'),
)

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('delivery')
  const active = TABS.find((tab) => tab.id === activeTab)!
  const { goal, setText, linkIssue, unlinkIssue } = useDeliveryGoal(deliveryGoalSeed)
  const jira = useJiraIssues(demoJiraIssues)
  const slack = useSlackMessages(slackMessages)
  const jiraIssues = useMemo(() => (jira.ready ? jira.issues : []), [jira.issues, jira.ready])
  const generatedJiraInsights = useMemo(
    () => generateJiraInsights(jiraIssues, jira.source === 'live' ? new Date() : DEMO_REFERENCE_DATE),
    [jiraIssues, jira.source],
  )
  const insightSeed = useMemo(
    () => [
      ...generatedJiraInsights,
      ...(slack.source === 'live'
        ? generateSlackInsights(slack.messages)
        : NON_JIRA_DEMO_INSIGHTS),
      ...(slack.source === 'live' ? DELIVERY_DEMO_INSIGHTS : []),
    ],
    [generatedJiraInsights, slack.messages, slack.source],
  )
  const detectedTeamSignals = useMemo(
    () => detectTeamSignals({
      jiraIssues,
      jiraDataSource: jira.source,
      slackMessages: slack.messages,
      slackDataSource: slack.source,
      pullRequestMetrics: pullRequestPeriodMetrics,
      retrospectiveActions: retrospectiveActionPoints,
      referenceDate: jira.source === 'live' ? new Date() : DEMO_REFERENCE_DATE,
    }),
    [jiraIssues, jira.source, slack.messages, slack.source],
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
            Leo FreYa Tech
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Team Frontend Platform
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
            issues={jiraIssues}
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
            ready={jira.ready}
            error={jira.error}
            onRefresh={jira.refresh}
          />
        )}
        {activeTab === 'insights' && (
          <AIInsights
            insights={insights}
            jiraIssues={jiraIssues}
            slackMessages={slack.messages}
            slackDataSource={slack.source}
            slackSyncedAt={slack.syncedAt}
            slackLoading={slack.loading}
            slackError={slack.error}
            onRefreshSlack={slack.refresh}
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
            jiraIssues={jiraIssues}
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
            jiraIssues={jiraIssues}
            slackSource={slack.source}
            slackMessageCount={slack.messages.length}
            slackSyncedAt={slack.syncedAt}
            slackLoading={slack.loading}
            slackError={slack.error}
            onRefreshSlack={slack.refresh}
            onCreateAction={suggestActionFromSignal}
            onSetStatus={setSignalStatus}
          />
        )}
      </section>

      <footer className="mt-10 border-t border-[var(--border)] pt-6 text-center text-xs leading-relaxed text-[var(--text-muted)]">
        <p>
          Data sources: Jira ({jira.source === 'live' ? 'live' : 'demo fallback'}) and Slack ({slack.source === 'live' ? 'live' : 'demo fallback'}).
          {' '}Demo data is used for GitHub review metrics, retrospective follow-ups, team context, seeded actions, and integration fallback examples.
        </p>
        <p className="mt-3">
          Created with Intention by Emma Smedslund in collaboration with CloudCode 2026 ·{' '}
          <a
            href="https://github.com/emma-smedslund"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--series-blue)] hover:underline"
          >
            GitHub
          </a>
          {' · '}
          <a
            href="https://www.linkedin.com/in/emmasmedslund/"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--series-blue)] hover:underline"
          >
            LinkedIn
          </a>
        </p>
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
