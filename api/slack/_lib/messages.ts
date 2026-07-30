import { getConfiguredSlackChannels } from './channels.js'
import { callSlackApi, SlackIntegrationError } from './client.js'
import type {
  SlackConversationHistoryResponse,
  SlackMessageResponse,
  SlackUserInfoResponse,
} from './types.js'

const WINDOW_DAYS = 14
const MAX_MESSAGES_PER_CHANNEL = 100

function timestampToIso(timestamp: string): string {
  const milliseconds = Number(timestamp) * 1000
  if (!Number.isFinite(milliseconds)) {
    throw new SlackIntegrationError('invalid_response', 'Slack returned an invalid message timestamp.', 502)
  }
  return new Date(milliseconds).toISOString()
}

async function getUserNames(userIds: string[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    [...new Set(userIds)].map(async (userId) => {
      const payload = await callSlackApi<SlackUserInfoResponse>(
        'users.info',
        new URLSearchParams({ user: userId }),
      )
      const user = payload.user
      if (!user) {
        throw new SlackIntegrationError('invalid_response', 'Slack returned an incomplete user record.', 502)
      }
      const name = user.profile?.display_name?.trim()
        || user.profile?.real_name?.trim()
        || user.real_name?.trim()
        || user.name?.trim()
        || 'Slack member'
      return [userId, name] as const
    }),
  )
  return new Map(entries)
}

function authorName(message: SlackMessageResponse, userNames: Map<string, string>): string {
  return message.bot_profile?.name?.trim()
    || message.username?.trim()
    || (message.user ? userNames.get(message.user) : undefined)
    || 'Slack app'
}

export async function getRecentSlackMessages() {
  const channelResult = await getConfiguredSlackChannels()
  const readableChannels = channelResult.channels.filter((channel) => channel.isMember)
  if (readableChannels.length === 0) {
    throw new SlackIntegrationError(
      'channel_access',
      'Invite the Slack bot to at least one configured channel before retrieving messages.',
      409,
    )
  }
  const oldest = String(Math.floor(Date.now() / 1000) - WINDOW_DAYS * 24 * 60 * 60)
  const channelMessages: Array<{
    channel: (typeof readableChannels)[number]
    messages: SlackMessageResponse[]
    truncated: boolean
  }> = []

  // Keep history calls sequential. This endpoint is refreshed on demand and
  // avoiding a burst is friendlier to Slack's per-method rate limits.
  for (const channel of readableChannels) {
    const page = await callSlackApi<SlackConversationHistoryResponse>(
      'conversations.history',
      new URLSearchParams({
        channel: channel.id,
        oldest,
        inclusive: 'true',
        limit: String(MAX_MESSAGES_PER_CHANNEL),
      }),
    )
    if (!Array.isArray(page.messages)) {
      throw new SlackIntegrationError('invalid_response', 'Slack returned an unexpected message response.', 502)
    }
    channelMessages.push({
      channel,
      messages: page.messages.filter(
        (message) =>
          (!message.subtype || message.subtype === 'bot_message') &&
          message.ts &&
          message.text,
      ),
      truncated: page.has_more === true || !!page.response_metadata?.next_cursor?.trim(),
    })
  }

  const userNames = await getUserNames(
    channelMessages.flatMap(({ messages }) =>
      messages.flatMap((message) => message.user && !message.bot_id ? [message.user] : []),
    ),
  )
  const messages = channelMessages
    .flatMap(({ channel, messages: rawMessages }) =>
      rawMessages.map((message) => ({
        id: `${channel.id}:${message.ts!}`,
        channel: `#${channel.name}`,
        authorName: authorName(message, userNames),
        timestamp: timestampToIso(message.ts!),
        text: message.text!,
        threadId: `${channel.id}:${message.thread_ts ?? message.ts!}`,
        replyCount: message.reply_count ?? 0,
      })),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return {
    messages,
    windowDays: WINDOW_DAYS,
    channelCount: readableChannels.length,
    truncatedChannels: channelMessages
      .filter(({ truncated }) => truncated)
      .map(({ channel }) => channel.name),
    syncedAt: new Date().toISOString(),
  }
}
