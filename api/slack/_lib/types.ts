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
