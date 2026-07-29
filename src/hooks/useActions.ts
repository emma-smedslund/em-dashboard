import { useEffect, useState } from 'react'
import type { AIInsight, ActionEntry, ActionPriority, TeamSignal } from '../types'
import { toISODate } from '../lib/date'
import { readStoredJson, writeStoredJson } from '../lib/storage'

const CONFIRMATION_DURATION_MS = 4000
const STORAGE_KEY = 'em-dashboard:actions-and-insight-decisions'
const STORAGE_VERSION = 1

type InsightDecision = Extract<AIInsight['status'], 'accepted' | 'dismissed'>

interface StoredActionState {
  version: 1
  actions: ActionEntry[]
  insightDecisions: Partial<Record<string, InsightDecision>>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isActionEntry(value: unknown): value is ActionEntry {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    ['suggested', 'active', 'completed', 'dismissed'].includes(String(value.status)) &&
    isNullableString(value.owner) &&
    isNullableString(value.dueDate) &&
    ['low', 'medium', 'high'].includes(String(value.priority)) &&
    ['ai', 'signal', 'manual'].includes(String(value.source)) &&
    typeof value.context === 'string' &&
    typeof value.createdDate === 'string'
  )
}

function loadStoredState(seedActions: ActionEntry[]): StoredActionState {
  const stored = readStoredJson(STORAGE_KEY)
  if (
    !isRecord(stored) ||
    stored.version !== STORAGE_VERSION ||
    !Array.isArray(stored.actions) ||
    !stored.actions.every(isActionEntry) ||
    !isRecord(stored.insightDecisions)
  ) {
    return { version: STORAGE_VERSION, actions: seedActions, insightDecisions: {} }
  }

  const insightDecisions = Object.fromEntries(
    Object.entries(stored.insightDecisions).filter(
      (entry): entry is [string, InsightDecision] =>
        entry[1] === 'accepted' || entry[1] === 'dismissed',
    ),
  )
  return { version: STORAGE_VERSION, actions: stored.actions, insightDecisions }
}

const CONFIDENCE_TO_PRIORITY: Record<AIInsight['confidence'], ActionPriority> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
}

const SIGNAL_TO_PRIORITY: Record<TeamSignal['severity'], ActionPriority> = {
  Info: 'low',
  Watch: 'medium',
  Attention: 'high',
}

export function useActions(seedInsights: AIInsight[], seedActions: ActionEntry[]) {
  const [storedState] = useState(() => loadStoredState(seedActions))
  const [insightDecisions, setInsightDecisions] = useState(storedState.insightDecisions)
  const [insights, setInsights] = useState(() =>
    seedInsights.map((insight) => ({
      ...insight,
      status: storedState.insightDecisions[insight.id] ?? insight.status,
    })),
  )
  const [actions, setActions] = useState(storedState.actions)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  // Jira-derived insights can change after the live request or a refresh.
  // Keep the EM's decision state while refreshing the generated content.
  useEffect(() => {
    setInsights((current) =>
      seedInsights.map((incoming) => ({
        ...incoming,
        status:
          insightDecisions[incoming.id] ??
          current.find((existing) => existing.id === incoming.id)?.status ??
          incoming.status,
      })),
    )
  }, [seedInsights, insightDecisions])

  useEffect(() => {
    writeStoredJson(STORAGE_KEY, {
      version: STORAGE_VERSION,
      actions,
      insightDecisions,
    } satisfies StoredActionState)
  }, [actions, insightDecisions])

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
      createdDate: toISODate(new Date()),
      sourceInsightId: insight.id,
      sourceInsightTitle: insight.title,
      sourceEvidence: insight.sources.map((s) => s.label),
      linkedJiraIssueIds: insight.sources
        .filter((source) => source.type === 'jira' && source.refId)
        .map((source) => source.refId!),
    }

    setActions((prev) => [action, ...prev])
    setInsights((prev) =>
      prev.map((i) => (i.id === insightId ? { ...i, status: 'accepted' } : i)),
    )
    setInsightDecisions((current) => ({ ...current, [insightId]: 'accepted' }))
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
    setInsightDecisions((current) => ({ ...current, [insightId]: 'dismissed' }))
  }

  function suggestActionFromSignal(signal: TeamSignal): boolean {
    if (actions.some((action) => action.sourceSignalId === signal.id)) {
      setConfirmation('This signal already has an action')
      return false
    }
    const action: ActionEntry = {
      id: `action-${signal.id}`,
      title: signal.suggestedFollowUp ?? `Follow up on: ${signal.title}`,
      status: 'suggested',
      owner: null,
      dueDate: null,
      priority: SIGNAL_TO_PRIORITY[signal.severity],
      source: 'signal',
      context: signal.summary,
      createdDate: toISODate(new Date()),
      sourceSignalId: signal.id,
      sourceSignalTitle: signal.title,
      sourceEvidence: signal.evidence.map((item) => item.label),
      linkedJiraIssueIds: signal.source === 'Jira'
        ? signal.evidence.flatMap((item) => item.refId ? [item.refId] : [])
        : undefined,
    }
    setActions((current) => [action, ...current])
    setConfirmation(`Sent to Actions: "${action.title}"`)
    return true
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
          ? { ...a, status: 'completed', completedDate: toISODate(new Date()) }
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
    linkedJiraIssueId: string | null
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
      linkedJiraIssueIds: input.linkedJiraIssueId ? [input.linkedJiraIssueId] : undefined,
      createdDate: toISODate(new Date()),
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
    suggestActionFromSignal,
    dismissInsight,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  }
}
