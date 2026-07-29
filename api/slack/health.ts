import { SlackIntegrationError, verifySlackConnection } from './_lib/client.js'

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
    response.status(405).json({
      connected: false,
      error: { code: 'method_not_allowed', message: 'Method not allowed.' },
    })
    return
  }

  response.setHeader('Cache-Control', 'private, no-store')
  try {
    response.status(200).json(await verifySlackConnection())
  } catch (error) {
    if (error instanceof SlackIntegrationError) {
      if (error.retryAfterSeconds) {
        response.setHeader('Retry-After', String(error.retryAfterSeconds))
      }
      response.status(error.status).json({
        connected: false,
        error: {
          code: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
      })
      return
    }
    response.status(502).json({
      connected: false,
      error: { code: 'unavailable', message: 'Slack connection could not be verified.' },
    })
  }
}
