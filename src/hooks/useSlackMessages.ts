import { useCallback, useEffect, useRef, useState } from 'react'
import type { SlackDataSource, SlackMessage } from '../types'
import { apiErrorMessage, isSlackMessagesResponse, requestJson } from '../lib/api'

export function useSlackMessages(demoMessages: SlackMessage[]) {
  const [messages, setMessages] = useState<SlackMessage[]>(demoMessages)
  const [source, setSource] = useState<SlackDataSource>('demo')
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [channelCount, setChannelCount] = useState(0)
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
      const { response, payload } = await requestJson('/api/slack/messages', controller.signal)
      if (!response.ok) throw new Error(apiErrorMessage(payload, 'Slack message request failed.'))
      if (!isSlackMessagesResponse(payload) || 'error' in payload) {
        throw new Error('Slack returned an unexpected message response.')
      }
      if (sequence !== requestSequence.current) return
      setMessages(payload.messages)
      setSource('live')
      setSyncedAt(payload.syncedAt)
      setChannelCount(payload.channelCount)
    } catch (requestError) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return
      setMessages(demoMessages)
      setSource('demo')
      setSyncedAt(null)
      setChannelCount(0)
      const message = requestError instanceof Error ? requestError.message : ''
      setError(message || 'Could not retrieve Slack messages.')
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [abortActiveRequest, demoMessages])

  useEffect(() => {
    void refresh()
    return abortActiveRequest
  }, [abortActiveRequest, refresh])

  return { messages, source, syncedAt, channelCount, loading, error, refresh }
}
