import { useSlackHealth } from '../hooks/useSlackHealth'
import { StatusPill } from './StatusPill'

export function SlackIntegrationStatus() {
  const { connection, loading, error, refresh } = useSlackHealth()

  return (
    <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <summary className="cursor-pointer text-xs font-medium text-[var(--text-secondary)]">
        Slack integration status
      </summary>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
          onClick={() => void refresh()}
          disabled={loading}
          className="text-xs font-medium text-[var(--series-blue)] hover:underline disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check connection'}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Phase 2 verifies authentication only. Channels and messages are not retrieved yet.
      </p>
    </details>
  )
}
