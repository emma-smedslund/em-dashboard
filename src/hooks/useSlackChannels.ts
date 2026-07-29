import { useCallback, useEffect, useState } from 'react'
import type { SlackChannelsResponse, SlackChannelsSuccess } from '../types/slack'

export function useSlackChannels() {
  const [data, setData] = useState<SlackChannelsSuccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/slack/channels', { headers: { Accept: 'application/json' } })
      const payload = await response.json() as SlackChannelsResponse
      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error.message : 'Slack channel request failed.')
      }
      setData(payload)
    } catch (requestError) {
      setData(null)
      const message = requestError instanceof Error ? requestError.message : ''
      setError(
        message && !message.includes('JSON') && !message.includes('Unexpected token')
          ? message
          : 'Could not retrieve configured Slack channels.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
