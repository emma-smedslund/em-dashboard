import type { SlackAuthTestResponse } from './types.js'

const SLACK_API_BASE_URL = 'https://slack.com/api'
const REQUEST_TIMEOUT_MS = 10_000

export type SlackIntegrationErrorCode =
  | 'not_configured'
  | 'authentication_failed'
  | 'missing_scope'
  | 'rate_limited'
  | 'unavailable'
  | 'invalid_response'

export class SlackIntegrationError extends Error {
  readonly code: SlackIntegrationErrorCode
  readonly status: number
  readonly retryAfterSeconds?: number

  constructor(
    code: SlackIntegrationErrorCode,
    message: string,
    status: number,
    retryAfterSeconds?: number,
  ) {
    super(message)
    this.code = code
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function getBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN?.trim()
  if (!token) {
    throw new SlackIntegrationError(
      'not_configured',
      'Slack integration is not configured on the server.',
      503,
    )
  }
  return token
}

function safeSlackApiError(error?: string): SlackIntegrationError {
  if (error === 'invalid_auth' || error === 'token_revoked' || error === 'account_inactive') {
    return new SlackIntegrationError(
      'authentication_failed',
      'Slack authentication failed. Check or reinstall the Slack app token.',
      401,
    )
  }
  if (error === 'missing_scope') {
    return new SlackIntegrationError(
      'missing_scope',
      'The Slack app is missing a required OAuth scope.',
      403,
    )
  }
  return new SlackIntegrationError(
    'unavailable',
    'Slack could not verify the connection right now.',
    502,
  )
}

export async function callSlackApi<T extends { ok?: boolean; error?: string }>(
  method: string,
  parameters?: URLSearchParams,
): Promise<T> {
  const token = getBotToken()
  let response: Response

  try {
    response = await fetch(`${SLACK_API_BASE_URL}/${method}`, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: parameters,
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new SlackIntegrationError('unavailable', 'Slack API timed out.', 504)
    }
    throw new SlackIntegrationError('unavailable', 'Slack API is unavailable.', 502)
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '0') || undefined
    throw new SlackIntegrationError(
      'rate_limited',
      'Slack rate limit reached. Try again shortly.',
      429,
      retryAfter,
    )
  }
  if (!response.ok) {
    throw new SlackIntegrationError('unavailable', 'Slack API is unavailable.', 502)
  }

  let payload: T
  try {
    payload = await response.json() as T
  } catch {
    throw new SlackIntegrationError(
      'invalid_response',
      'Slack returned an unexpected response.',
      502,
    )
  }
  if (!payload || typeof payload !== 'object' || typeof payload.ok !== 'boolean') {
    throw new SlackIntegrationError(
      'invalid_response',
      'Slack returned an unexpected response.',
      502,
    )
  }
  if (!payload.ok) throw safeSlackApiError(payload.error)
  return payload
}

export async function verifySlackConnection() {
  const payload = await callSlackApi<SlackAuthTestResponse>('auth.test')
  if (!payload.team || !payload.team_id || !payload.user_id) {
    throw new SlackIntegrationError(
      'invalid_response',
      'Slack connection details were incomplete.',
      502,
    )
  }
  return {
    connected: true as const,
    workspaceName: payload.team,
    workspaceId: payload.team_id,
    botUserId: payload.user_id,
    checkedAt: new Date().toISOString(),
  }
}
