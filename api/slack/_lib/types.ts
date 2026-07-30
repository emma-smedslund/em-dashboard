export interface SlackAuthTestResponse {
  ok?: boolean
  error?: string
  team?: string
  team_id?: string
  user_id?: string
}

export interface SlackConversationResponse {
  id?: string
  name?: string
  is_private?: boolean
  is_member?: boolean
  is_archived?: boolean
  purpose?: { value?: string }
  topic?: { value?: string }
}

export interface SlackConversationsListResponse {
  ok?: boolean
  error?: string
  channels?: SlackConversationResponse[]
  response_metadata?: { next_cursor?: string }
}

export interface SlackMessageResponse {
  ts?: string
  thread_ts?: string
  user?: string
  text?: string
  subtype?: string
  bot_id?: string
  username?: string
  reply_count?: number
  bot_profile?: { name?: string }
}

export interface SlackConversationHistoryResponse {
  ok?: boolean
  error?: string
  messages?: SlackMessageResponse[]
  has_more?: boolean
  response_metadata?: { next_cursor?: string }
}

export interface SlackUserInfoResponse {
  ok?: boolean
  error?: string
  user?: {
    id?: string
    real_name?: string
    name?: string
    profile?: { display_name?: string; real_name?: string }
  }
}
