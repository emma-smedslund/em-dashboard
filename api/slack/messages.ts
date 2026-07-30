import { SlackIntegrationError } from './_lib/client.js'
import { getRecentSlackMessages } from './_lib/messages.js'

interface ApiRequest { method?: string }
interface ApiResponse {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store')
  if (request.method !== 'GET') {
    response.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } })
    return
  }

  try {
    response.status(200).json(await getRecentSlackMessages())
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
      error: { code: 'unavailable', message: 'Slack messages could not be retrieved.' },
    })
  }
}
