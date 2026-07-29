import { useEffect, useState } from 'react'
import type { DeliveryGoal } from '../types'
import { readStoredJson, writeStoredJson } from '../lib/storage'

const STORAGE_KEY = 'em-dashboard:delivery-goal'

function loadStoredGoal(seed: DeliveryGoal): DeliveryGoal {
  const stored = readStoredJson(STORAGE_KEY)
  if (!stored || typeof stored !== 'object') return seed
  const parsed = stored as Partial<DeliveryGoal>
  if (typeof parsed.text !== 'string' || !Array.isArray(parsed.linkedIssueIds)) return seed
  const storedIssueIds = parsed.linkedIssueIds.filter(
    (issueId: unknown): issueId is string => typeof issueId === 'string',
  )
  const linkedIssueIds = storedIssueIds.filter(
    (issueId) => !issueId.toUpperCase().startsWith('ENG-'),
  )
  return {
    text: parsed.text,
    linkedIssueIds:
      storedIssueIds.length > 0 && linkedIssueIds.length === 0
        ? seed.linkedIssueIds
        : linkedIssueIds,
  }
}

export function useDeliveryGoal(seed: DeliveryGoal) {
  const [goal, setGoal] = useState<DeliveryGoal>(() => loadStoredGoal(seed))

  useEffect(() => {
    writeStoredJson(STORAGE_KEY, goal)
  }, [goal])

  function setText(text: string) {
    setGoal((g) => ({ ...g, text }))
  }

  function linkIssue(issueId: string) {
    setGoal((g) => (g.linkedIssueIds.includes(issueId) ? g : { ...g, linkedIssueIds: [...g.linkedIssueIds, issueId] }))
  }

  function unlinkIssue(issueId: string) {
    setGoal((g) => ({ ...g, linkedIssueIds: g.linkedIssueIds.filter((id) => id !== issueId) }))
  }

  return { goal, setText, linkIssue, unlinkIssue }
}
