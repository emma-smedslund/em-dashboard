import { useCallback, useEffect, useRef, useState } from 'react'
import type { SlackChannelsSuccess } from '../types/slack'
import { apiErrorMessage, isSlackChannelsResponse, requestJson } from '../lib/api'

export function useSlackChannels() {
  const [data, setData] = useState<SlackChannelsSuccess | null>(null)
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
      const { response, payload } = await requestJson('/api/slack/channels', controller.signal)
      if (!isSlackChannelsResponse(payload)) throw new Error('Slack returned an unexpected channel response.')
      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error.message : apiErrorMessage(payload, 'Slack channel request failed.'))
      }
      if (sequence !== requestSequence.current) return
      setData(payload)
    } catch (requestError) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return
      setData(null)
      const message = requestError instanceof Error ? requestError.message : ''
      setError(
        message && !message.includes('JSON') && !message.includes('Unexpected token')
          ? message
          : 'Could not retrieve configured Slack channels.',
      )
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [abortActiveRequest])

  useEffect(() => {
    void refresh()
    return abortActiveRequest
  }, [abortActiveRequest, refresh])

  return { data, loading, error, refresh }
}
