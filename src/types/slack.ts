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

export interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  isMember: boolean
  purpose?: string
  topic?: string
  availability: 'available' | 'bot_not_member'
}

export interface MissingSlackChannel {
  name: string
  reason: 'not_found'
}

export interface SlackChannelsSuccess {
  channels: SlackChannel[]
  missingChannels: MissingSlackChannel[]
  configuredCount: number
  foundCount: number
  joinedCount: number
  syncedAt: string
}

export interface SlackChannelsFailure {
  error: {
    code: string
    message: string
    retryAfterSeconds?: number
  }
}

export type SlackChannelsResponse = SlackChannelsSuccess | SlackChannelsFailure

export interface SlackMessagesSuccess {
  messages: import('./index').SlackMessage[]
  windowDays: number
  channelCount: number
  truncatedChannels: string[]
  syncedAt: string
}

export type SlackMessagesResponse = SlackMessagesSuccess | SlackChannelsFailure
