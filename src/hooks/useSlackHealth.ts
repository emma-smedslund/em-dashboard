import { useCallback, useEffect, useRef, useState } from 'react'
import type { SlackHealthSuccess } from '../types/slack'
import { apiErrorMessage, isSlackHealthResponse, requestJson } from '../lib/api'

export function useSlackHealth() {
  const [connection, setConnection] = useState<SlackHealthSuccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const requestSequence = useRef(0)
  const abortActiveRequest = useCallback(() => activeRequest.current?.abort(), [])

  const refresh = useCallback(async () => {
    abortActiveRequest()
    const controller = new AbortController()
    activeRequest.current = controller
    const sequence = ++requestSequence.current
    setLoading(true)
    setError(null)
    try {
      const { response, payload } = await requestJson('/api/slack/health', controller.signal)
      if (!isSlackHealthResponse(payload)) throw new Error('Slack returned an unexpected response.')
      if (!response.ok || !payload.connected) {
        throw new Error(!payload.connected ? payload.error.message : apiErrorMessage(payload, 'Slack connection failed.'))
      }
      if (sequence !== requestSequence.current) return
      setConnection(payload)
    } catch (requestError) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return
      setConnection(null)
      const message = requestError instanceof Error ? requestError.message : ''
      setError(
        message && !message.includes('JSON') && !message.includes('Unexpected token')
          ? message
          : 'Could not check the Slack connection.',
      )
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [abortActiveRequest])

  useEffect(() => {
    void refresh()
    return abortActiveRequest
  }, [abortActiveRequest, refresh])

  return { connection, loading, error, refresh }
}
