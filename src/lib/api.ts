import type { JiraIssuesResponse, JiraIssue } from '../types'
import type {
  SlackChannelsResponse,
  SlackHealthResponse,
} from '../types/slack'

const REQUEST_TIMEOUT_MS = 15_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isJiraIssue(value: unknown): value is JiraIssue {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.title) &&
    ['todo', 'in_progress', 'blocked', 'done'].includes(String(value.status)) &&
    isString(value.assigneeId) &&
    isString(value.epic) &&
    isString(value.updatedDate)
  )
}

export function isJiraIssuesResponse(value: unknown): value is JiraIssuesResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.issues) &&
    value.issues.every(isJiraIssue) &&
    isString(value.projectKey) &&
    isString(value.syncedAt)
  )
}

function isApiError(value: unknown): boolean {
  return isRecord(value) && isString(value.code) && isString(value.message)
}

export function isSlackHealthResponse(value: unknown): value is SlackHealthResponse {
  if (!isRecord(value) || typeof value.connected !== 'boolean') return false
  return value.connected
    ? isString(value.workspaceName) &&
        isString(value.workspaceId) &&
        isString(value.botUserId) &&
        isString(value.checkedAt)
    : isApiError(value.error)
}

export function isSlackChannelsResponse(value: unknown): value is SlackChannelsResponse {
  if (!isRecord(value)) return false
  if ('error' in value) return isApiError(value.error)
  return (
    Array.isArray(value.channels) &&
    value.channels.every(
      (channel) =>
        isRecord(channel) &&
        isString(channel.id) &&
        isString(channel.name) &&
        typeof channel.isMember === 'boolean',
    ) &&
    Array.isArray(value.missingChannels) &&
    typeof value.configuredCount === 'number' &&
    typeof value.foundCount === 'number' &&
    typeof value.joinedCount === 'number' &&
    isString(value.syncedAt)
  )
}

export async function requestJson(url: string, signal: AbortSignal): Promise<{
  response: Response
  payload: unknown
}> {
  const timeoutController = new AbortController()
  const timeout = window.setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => timeoutController.abort()
  signal.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: timeoutController.signal,
    })
    const text = await response.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      throw new Error('The server returned an invalid response.')
    }
    return { response, payload }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (signal.aborted) throw error
      throw new Error('The request timed out. Try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener('abort', abortFromCaller)
  }
}

export function apiErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback
  if (isString(payload.error)) return payload.error
  if (isRecord(payload.error) && isString(payload.error.message)) return payload.error.message
  return fallback
}
