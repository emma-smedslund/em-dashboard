import { useMemo, useState } from 'react'
import { TeamSignals } from './components/TeamSignals'
import { DeliveryRadar } from './components/DeliveryRadar'
import { Actions } from './components/Actions'
import { TabNav } from './components/TabNav'
import { useActions } from './hooks/useActions'
import { useDeliveryGoal } from './hooks/useDeliveryGoal'
import { useJiraIssues } from './hooks/useJiraIssues'
import {
  teamMembers,
  actionEntries,
  jiraIssues as demoJiraIssues,
  slackMessages,
  deliveryGoalSeed,
} from './data/mockData'
import { DEMO_REFERENCE_DATE, formatAsOf } from './lib/date'
import { detectTeamSignals } from './lib/teamSignals'
import { pullRequestPeriodMetrics, retrospectiveActionPoints } from './data/teamSignalData'
import { useTeamSignals } from './hooks/useTeamSignals'
import { useSlackMessages } from './hooks/useSlackMessages'
import { applyTeamDisplayNamesToJiraIssues, resolveTeamMembersFromSlack } from './lib/teamIdentity'

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
    description: 'Suggested and manually added follow-ups, from proposal to completion.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('delivery')
  const active = TABS.find((tab) => tab.id === activeTab)!
  const { goal, setText, linkIssue, unlinkIssue } = useDeliveryGoal(deliveryGoalSeed)
  const jira = useJiraIssues(demoJiraIssues)
  const slack = useSlackMessages(slackMessages)
  const displayedTeamMembers = useMemo(
    () => resolveTeamMembersFromSlack(teamMembers, slack.source === 'live' ? slack.messages : []),
    [slack.messages, slack.source],
  )
  const jiraIssues = useMemo(
    () => applyTeamDisplayNamesToJiraIssues(
      jira.ready ? jira.issues : [],
      displayedTeamMembers,
    ),
    [displayedTeamMembers, jira.issues, jira.ready],
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
    actions,
    suggestActionFromSignal,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  } = useActions(actionEntries, displayedTeamMembers)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Leo Freya Tech
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
            members={displayedTeamMembers}
            goal={goal}
            onSetGoalText={setText}
            onLinkIssue={linkIssue}
            onUnlinkIssue={unlinkIssue}
            onViewSignals={() => setActiveTab('signals')}
            dataSource={jira.source}
            projectKey={jira.projectKey}
            syncedAt={jira.syncedAt}
            loading={jira.loading}
            ready={jira.ready}
            error={jira.error}
            onRefresh={jira.refresh}
          />
        )}
        {activeTab === 'actions' && (
          <Actions
            actions={actions}
            members={displayedTeamMembers}
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
          />
        )}
        {activeTab === 'signals' && (
          <TeamSignals
            signals={teamSignals}
            jiraIssues={jiraIssues}
            jiraDataSource={jira.source}
            slackMessages={slack.messages}
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
