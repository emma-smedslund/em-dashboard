import { getConfiguredSlackChannels } from './_lib/channels.js'
import { callSlackApi, SlackIntegrationError } from './_lib/client.js'
import type { SlackPermalinkResponse } from './_lib/types.js'

interface ApiRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
  redirect(status: number, location: string): void
}

function queryValue(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ''
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store')
  if (request.method !== 'GET') {
    response.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } })
    return
  }

  const channel = queryValue(request.query?.channel)
  const messageTimestamp = queryValue(request.query?.message_ts)
  if (!/^[A-Z0-9]+$/.test(channel) || !/^\d+\.\d+$/.test(messageTimestamp)) {
    response.status(400).json({ error: { code: 'invalid_request', message: 'Invalid Slack message reference.' } })
    return
  }

  try {
    const configured = await getConfiguredSlackChannels()
    const channelIsAllowed = configured.channels.some(
      (candidate) => candidate.id === channel && candidate.isMember,
    )
    if (!channelIsAllowed) {
      response.status(404).json({ error: { code: 'not_found', message: 'Slack message is not available.' } })
      return
    }

    const payload = await callSlackApi<SlackPermalinkResponse>(
      'chat.getPermalink',
      new URLSearchParams({ channel, message_ts: messageTimestamp }),
    )
    if (!payload.permalink) {
      throw new SlackIntegrationError('invalid_response', 'Slack did not return a message link.', 502)
    }
    response.redirect(302, payload.permalink)
  } catch (error) {
    if (error instanceof SlackIntegrationError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } })
      return
    }
    response.status(502).json({ error: { code: 'unavailable', message: 'Slack message link is unavailable.' } })
  }
}
