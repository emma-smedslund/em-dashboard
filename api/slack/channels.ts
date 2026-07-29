import { getConfiguredSlackChannels } from './_lib/channels.js'
import { SlackIntegrationError } from './_lib/client.js'

interface ApiRequest {
  method?: string
}

interface ApiResponse {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } })
    return
  }

  response.setHeader('Cache-Control', 'private, no-store')
  try {
    response.status(200).json(await getConfiguredSlackChannels())
  } catch (error) {
    if (error instanceof SlackIntegrationError) {
      if (error.retryAfterSeconds) response.setHeader('Retry-After', String(error.retryAfterSeconds))
      response.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
      })
      return
    }
    response.status(502).json({
      error: { code: 'unavailable', message: 'Slack channels could not be retrieved.' },
    })
  }
}
