import { useEffect, useState } from 'react'
import type { AIInsight, ActionEntry, ActionPriority } from '../types'
import { TODAY, toISODate } from '../lib/date'

const CONFIRMATION_DURATION_MS = 4000

const CONFIDENCE_TO_PRIORITY: Record<AIInsight['confidence'], ActionPriority> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
}

export function useActions(seedInsights: AIInsight[], seedActions: ActionEntry[]) {
  const [insights, setInsights] = useState(seedInsights)
  const [actions, setActions] = useState(seedActions)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  // Jira-derived insights can change after the live request or a refresh.
  // Keep the EM's decision state while refreshing the generated content.
  useEffect(() => {
    setInsights((current) =>
      seedInsights.map((incoming) => ({
        ...incoming,
        status: current.find((existing) => existing.id === incoming.id)?.status ?? incoming.status,
      })),
    )
  }, [seedInsights])

  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(null), CONFIRMATION_DURATION_MS)
    return () => clearTimeout(timer)
  }, [confirmation])

  // AI can only ever propose a 'suggested' action here — turning it into
  // something active/assigned always requires a separate acceptAction call.
  function suggestActionFromInsight(insightId: string) {
    const insight = insights.find((i) => i.id === insightId)
    if (!insight || insight.status !== 'new') return // already actioned or dismissed
    if (actions.some((a) => a.sourceInsightId === insightId)) return // extra guard against duplicates

    const action: ActionEntry = {
      id: `action-${insightId}`,
      title: insight.recommendedAction,
      status: 'suggested',
      owner: null,
      dueDate: null,
      priority: CONFIDENCE_TO_PRIORITY[insight.confidence],
      source: 'ai',
      context: insight.summary,
      createdDate: toISODate(TODAY),
      sourceInsightId: insight.id,
      sourceInsightTitle: insight.title,
      sourceEvidence: insight.sources.map((s) => s.label),
    }

    setActions((prev) => [action, ...prev])
    setInsights((prev) =>
      prev.map((i) => (i.id === insightId ? { ...i, status: 'accepted' } : i)),
    )
    setConfirmation(`Sent to Actions: "${action.title}"`)
  }

  function dismissInsight(insightId: string) {
    setInsights((prev) =>
      prev.map((i) =>
        i.id === insightId && i.status === 'new'
          ? { ...i, status: 'dismissed' }
          : i,
      ),
    )
  }

  // The moment a suggestion becomes a real, owned, scheduled action — the
  // EM's decision point, never taken automatically.
  function acceptAction(
    actionId: string,
    details: { owner: string | null; dueDate: string | null; priority: ActionPriority },
  ) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId && a.status === 'suggested'
          ? { ...a, ...details, status: 'active' }
          : a,
      ),
    )
    setConfirmation('Action accepted')
  }

  function dismissAction(actionId: string) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId && (a.status === 'suggested' || a.status === 'active')
          ? { ...a, status: 'dismissed' }
          : a,
      ),
    )
  }

  function completeAction(actionId: string) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId && a.status === 'active'
          ? { ...a, status: 'completed', completedDate: toISODate(TODAY) }
          : a,
      ),
    )
    setConfirmation('Action marked complete')
  }

  function addManualAction(input: {
    title: string
    owner: string | null
    dueDate: string | null
    priority: ActionPriority
    context: string
  }) {
    const action: ActionEntry = {
      id: `manual-${Date.now()}`,
      title: input.title,
      status: 'active',
      owner: input.owner,
      dueDate: input.dueDate,
      priority: input.priority,
      source: 'manual',
      context: input.context,
      createdDate: toISODate(TODAY),
    }
    setActions((prev) => [action, ...prev])
    setConfirmation(`Action added: "${action.title}"`)
  }

  function clearConfirmation() {
    setConfirmation(null)
  }

  return {
    insights,
    actions,
    suggestActionFromInsight,
    dismissInsight,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  }
}
