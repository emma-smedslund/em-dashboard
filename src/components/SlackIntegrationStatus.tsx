import { useSlackHealth } from '../hooks/useSlackHealth'
import { useSlackChannels } from '../hooks/useSlackChannels'
import { StatusPill } from './StatusPill'
import type { SlackDataSource } from '../types'

export function SlackIntegrationStatus({
  messageSource,
  messageCount,
  messagesSyncedAt,
  messagesLoading,
  messagesError,
  onRefreshMessages,
}: {
  messageSource: SlackDataSource
  messageCount: number
  messagesSyncedAt: string | null
  messagesLoading: boolean
  messagesError: string | null
  onRefreshMessages: () => void
}) {
  const { connection, loading, error, refresh } = useSlackHealth()
  const channels = useSlackChannels()

  function refreshAll() {
    void refresh()
    void channels.refresh()
    onRefreshMessages()
  }

  return (
    <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <summary className="cursor-pointer text-xs font-medium text-[var(--text-secondary)]">
        Slack integration status
      </summary>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
          <StatusPill
            level={connection ? 'good' : 'neutral'}
            label={loading ? 'Checking Slack…' : connection ? 'Slack connected' : 'Slack not connected'}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {loading
              ? 'Verifying the server-side connection.'
              : connection
                ? `${connection.workspaceName} · checked ${new Date(connection.checkedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : error}
          </span>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={loading || channels.loading || messagesLoading}
          className="text-xs font-medium text-[var(--series-blue)] hover:underline disabled:opacity-50"
        >
          {loading || channels.loading || messagesLoading ? 'Checking…' : 'Refresh Slack data'}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Phase 4 reads recent messages from joined channels. The app uses demo Slack data if retrieval fails.
      </p>
      <div className="mt-3 flex flex-col items-start gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center">
        <StatusPill
          level={messageSource === 'live' ? 'good' : 'neutral'}
          label={messageSource === 'live' ? 'Live messages' : 'Demo messages'}
        />
        <span className="text-xs text-[var(--text-muted)]">
          {messagesLoading
            ? 'Retrieving the last 14 days…'
            : messageSource === 'live'
              ? `${messageCount} messages · last synced ${messagesSyncedAt ? new Date(messagesSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'just now'} · auto-refreshes every 5 min`
              : messagesError ?? 'Live Slack messages are unavailable.'}
        </span>
      </div>
      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Configured channels
        </p>
        {channels.loading ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">Retrieving channel access…</p>
        ) : channels.error ? (
          <p className="mt-2 text-xs text-[var(--status-critical)]">{channels.error}</p>
        ) : channels.data ? (
          <>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {channels.data.foundCount}/{channels.data.configuredCount} found · {channels.data.joinedCount} joined
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {channels.data.channels.map((channel) => (
                <li key={channel.id} className="flex flex-col items-start gap-2 rounded-md bg-[var(--page-plane)] p-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[var(--text-primary)]">#{channel.name}</p>
                    <p className="truncate text-[10px] text-[var(--text-muted)]">{channel.id}</p>
                  </div>
                  <StatusPill
                    level={channel.isMember ? 'good' : 'warning'}
                    label={channel.isMember ? 'Bot joined' : 'Invite bot'}
                  />
                </li>
              ))}
              {channels.data.missingChannels.map((channel) => (
                <li key={channel.name} className="flex flex-col items-start gap-2 rounded-md bg-[var(--page-plane)] p-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">#{channel.name}</p>
                  <StatusPill level="critical" label="Not found" />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </details>
  )
}
