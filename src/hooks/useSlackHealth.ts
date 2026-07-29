import { useCallback, useEffect, useState } from 'react'
import type { SlackHealthSuccess, SlackHealthResponse } from '../types/slack'

export function useSlackHealth() {
  const [connection, setConnection] = useState<SlackHealthSuccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/slack/health', { headers: { Accept: 'application/json' } })
      const payload = await response.json() as SlackHealthResponse
      if (!response.ok || !payload.connected) {
        throw new Error(!payload.connected ? payload.error.message : 'Slack connection failed.')
      }
      setConnection(payload)
    } catch (requestError) {
      setConnection(null)
      const message = requestError instanceof Error ? requestError.message : ''
      setError(
        message && !message.includes('JSON') && !message.includes('Unexpected token')
          ? message
          : 'Could not check the Slack connection.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { connection, loading, error, refresh }
}
