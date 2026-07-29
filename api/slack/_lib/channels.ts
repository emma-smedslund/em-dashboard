import { callSlackApi, SlackIntegrationError } from './client.js'
import { DASHBOARD_SLACK_CHANNEL_NAMES } from './config.js'
import type { SlackConversationResponse, SlackConversationsListResponse } from './types.js'

const PAGE_SIZE = 200
const MAX_PAGES = 10

function normalizeChannel(channel: SlackConversationResponse) {
  if (!channel.id || !channel.name) {
    throw new SlackIntegrationError(
      'invalid_response',
      'Slack returned an incomplete channel record.',
      502,
    )
  }
  return {
    id: channel.id,
    name: channel.name,
    isPrivate: channel.is_private === true,
    isMember: channel.is_member === true,
    purpose: channel.purpose?.value?.trim() || undefined,
    topic: channel.topic?.value?.trim() || undefined,
    availability: channel.is_member === true ? 'available' as const : 'bot_not_member' as const,
  }
}

export async function getConfiguredSlackChannels() {
  const channelsByName = new Map<string, SlackConversationResponse>()
  let cursor = ''
  let pageCount = 0

  do {
    const parameters = new URLSearchParams({
      exclude_archived: 'true',
      limit: String(PAGE_SIZE),
      types: 'public_channel',
    })
    if (cursor) parameters.set('cursor', cursor)

    const page = await callSlackApi<SlackConversationsListResponse>(
      'conversations.list',
      parameters,
    )
    if (!Array.isArray(page.channels)) {
      throw new SlackIntegrationError(
        'invalid_response',
        'Slack returned an unexpected channel response.',
        502,
      )
    }

    for (const channel of page.channels) {
      if (
        channel.name &&
        !channel.is_archived &&
        DASHBOARD_SLACK_CHANNEL_NAMES.includes(
          channel.name as (typeof DASHBOARD_SLACK_CHANNEL_NAMES)[number],
        )
      ) {
        channelsByName.set(channel.name, channel)
      }
    }

    cursor = page.response_metadata?.next_cursor?.trim() ?? ''
    pageCount += 1
  } while (
    cursor &&
    pageCount < MAX_PAGES &&
    channelsByName.size < DASHBOARD_SLACK_CHANNEL_NAMES.length
  )

  if (cursor && pageCount >= MAX_PAGES) {
    throw new SlackIntegrationError(
      'invalid_response',
      'Slack channel pagination exceeded the safe request limit.',
      502,
    )
  }

  const channels = DASHBOARD_SLACK_CHANNEL_NAMES
    .flatMap((name) => {
      const channel = channelsByName.get(name)
      return channel ? [normalizeChannel(channel)] : []
    })
  const missingChannels = DASHBOARD_SLACK_CHANNEL_NAMES
    .filter((name) => !channelsByName.has(name))
    .map((name) => ({ name, reason: 'not_found' as const }))

  return {
    channels,
    missingChannels,
    configuredCount: DASHBOARD_SLACK_CHANNEL_NAMES.length,
    foundCount: channels.length,
    joinedCount: channels.filter((channel) => channel.isMember).length,
    syncedAt: new Date().toISOString(),
  }
}
