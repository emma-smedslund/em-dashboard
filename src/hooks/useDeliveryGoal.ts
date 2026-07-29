import { useEffect, useState } from 'react'
import type { DeliveryGoal } from '../types'

const STORAGE_KEY = 'em-dashboard:delivery-goal'

function loadStoredGoal(seed: DeliveryGoal): DeliveryGoal {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return seed
    const parsed = JSON.parse(stored)
    if (typeof parsed.text !== 'string' || !Array.isArray(parsed.linkedIssueIds)) return seed
    const linkedIssueIds = parsed.linkedIssueIds.filter(
      (issueId: unknown): issueId is string =>
        typeof issueId === 'string' && !issueId.toUpperCase().startsWith('ENG-'),
    )
    return {
      text: parsed.text,
      linkedIssueIds: linkedIssueIds.length > 0 ? linkedIssueIds : seed.linkedIssueIds,
    }
  } catch {
    return seed
  }
}

export function useDeliveryGoal(seed: DeliveryGoal) {
  const [goal, setGoal] = useState<DeliveryGoal>(() => loadStoredGoal(seed))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goal))
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
