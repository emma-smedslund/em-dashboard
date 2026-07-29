export interface SlackHealthSuccess {
  connected: true
  workspaceName: string
  workspaceId: string
  botUserId: string
  checkedAt: string
}

export interface SlackHealthFailure {
  connected: false
  error: {
    code: string
    message: string
    retryAfterSeconds?: number
  }
}

export type SlackHealthResponse = SlackHealthSuccess | SlackHealthFailure
