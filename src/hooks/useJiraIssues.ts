import { useCallback, useEffect, useRef, useState } from 'react'
import type { JiraDataSource, JiraIssue } from '../types'
import { apiErrorMessage, isJiraIssuesResponse, requestJson } from '../lib/api'

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function useJiraIssues(demoIssues: JiraIssue[]) {
  const [issues, setIssues] = useState<JiraIssue[]>([])
  const [source, setSource] = useState<JiraDataSource>('demo')
  const [projectKey, setProjectKey] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
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
      const { response, payload } = await requestJson('/api/jira/issues', controller.signal)

      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Jira request failed'))
      }
      if (!isJiraIssuesResponse(payload)) throw new Error('Jira returned an unexpected response.')
      if (sequence !== requestSequence.current) return

      setIssues(payload.issues)
      setProjectKey(payload.projectKey)
      setSyncedAt(payload.syncedAt)
      setSource('live')
    } catch (requestError) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return
      setIssues(demoIssues)
      setProjectKey(null)
      setSyncedAt(null)
      setSource('demo')
      const message = requestError instanceof Error ? requestError.message : ''
      setError(
        message && !message.includes('JSON') && !message.includes('Unexpected token')
          ? message
          : 'Could not connect to Jira',
      )
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false)
        setReady(true)
      }
    }
  }, [abortActiveRequest, demoIssues])

  useEffect(() => {
    void refresh()
    return abortActiveRequest
  }, [abortActiveRequest, refresh])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [refresh])

  return { issues, source, projectKey, syncedAt, loading, ready, error, refresh }
}
