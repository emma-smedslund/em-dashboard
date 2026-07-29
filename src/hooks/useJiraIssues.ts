import { useCallback, useEffect, useState } from 'react'
import type { JiraDataSource, JiraIssue, JiraIssuesResponse } from '../types'

export function useJiraIssues(demoIssues: JiraIssue[]) {
  const [issues, setIssues] = useState(demoIssues)
  const [source, setSource] = useState<JiraDataSource>('demo')
  const [projectKey, setProjectKey] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/jira/issues', {
        headers: { Accept: 'application/json' },
      })
      const payload = (await response.json()) as JiraIssuesResponse | { error?: string }

      if (!response.ok || !('issues' in payload)) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Jira request failed')
      }

      setIssues(payload.issues)
      setProjectKey(payload.projectKey)
      setSyncedAt(payload.syncedAt)
      setSource('live')
    } catch (requestError) {
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
      setLoading(false)
    }
  }, [demoIssues])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { issues, source, projectKey, syncedAt, loading, error, refresh }
}
