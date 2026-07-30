import { useEffect, useState } from 'react'
import type { ActionEntry, ActionPriority, TeamMember, TeamSignal } from '../types'
import { toISODate } from '../lib/date'
import { readStoredJson, writeStoredJson } from '../lib/storage'

const CONFIRMATION_DURATION_MS = 4000
const STORAGE_KEY = 'em-dashboard:actions-and-insight-decisions'
const STORAGE_VERSION = 2

interface StoredActionState {
  version: 2
  actions: ActionEntry[]
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
    !Array.isArray(stored.actions) ||
    !stored.actions.every(isActionEntry)
  ) {
    return { version: STORAGE_VERSION, actions: seedActions }
  }
  return { version: STORAGE_VERSION, actions: stored.actions }
}

const SIGNAL_TO_PRIORITY: Record<TeamSignal['severity'], ActionPriority> = {
  Info: 'low',
  Watch: 'medium',
  Attention: 'high',
}

function updateNameMentions(value: string, members: TeamMember[]): string {
  return members.reduce((current, member) => {
    const firstName = member.name.split(/\s+/)[0]
    if (!firstName || member.name === firstName || current.includes(member.name)) return current
    return current.replace(new RegExp(`\\b${firstName}\\b`, 'g'), member.name)
  }, value)
}

function normalizeActionNames(action: ActionEntry, members: TeamMember[]): ActionEntry {
  const matchingOwner = action.owner
    ? members.find((member) => member.name.split(/\s+/)[0] === action.owner?.split(/\s+/)[0])
    : undefined
  return {
    ...action,
    owner: matchingOwner?.name ?? action.owner,
    title: updateNameMentions(action.title, members),
    context: updateNameMentions(action.context, members),
    sourceSignalTitle: action.sourceSignalTitle
      ? updateNameMentions(action.sourceSignalTitle, members)
      : undefined,
    sourceInsightTitle: action.sourceInsightTitle
      ? updateNameMentions(action.sourceInsightTitle, members)
      : undefined,
    sourceEvidence: action.sourceEvidence?.map((item) => updateNameMentions(item, members)),
  }
}

export function useActions(seedActions: ActionEntry[], members: TeamMember[]) {
  const [storedState] = useState(() => loadStoredState(seedActions))
  const [actions, setActions] = useState(storedState.actions)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    writeStoredJson(STORAGE_KEY, {
      version: STORAGE_VERSION,
      actions,
    } satisfies StoredActionState)
  }, [actions])

  useEffect(() => {
    setActions((current) => {
      const normalized = current.map((action) => normalizeActionNames(action, members))
      return normalized.some((action, index) => JSON.stringify(action) !== JSON.stringify(current[index]))
        ? normalized
        : current
    })
  }, [members])

  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(null), CONFIRMATION_DURATION_MS)
    return () => clearTimeout(timer)
  }, [confirmation])

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
      sourceDataMode: signal.sourceMode,
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
          ? { ...a, ...details, status: 'active', decisionDate: toISODate(new Date()) }
          : a,
      ),
    )
    setConfirmation('Action accepted')
  }

  function dismissAction(actionId: string) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId && (a.status === 'suggested' || a.status === 'active')
          ? { ...a, status: 'dismissed', decisionDate: toISODate(new Date()) }
          : a,
      ),
    )
  }

  function completeAction(actionId: string) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId && a.status === 'active'
          ? { ...a, status: 'completed', completedDate: toISODate(new Date()), decisionDate: toISODate(new Date()) }
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
      decisionDate: toISODate(new Date()),
    }
    setActions((prev) => [action, ...prev])
    setConfirmation(`Action added: "${action.title}"`)
  }

  function clearConfirmation() {
    setConfirmation(null)
  }

  return {
    actions,
    suggestActionFromSignal,
    acceptAction,
    dismissAction,
    completeAction,
    addManualAction,
    confirmation,
    clearConfirmation,
  }
}
