type InternalStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

interface JiraSearchIssue {
  key: string
  fields: {
    summary: string
    status: { name: string; statusCategory?: { key?: string } }
    assignee: { accountId?: string; displayName?: string } | null
    created: string
    updated: string
    resolutiondate: string | null
    parent?: { fields?: { summary?: string } }
    issuelinks?: Array<{
      type: { inward?: string; outward?: string }
      inwardIssue?: { key: string; fields?: { summary?: string } }
      outwardIssue?: { key: string; fields?: { summary?: string } }
    }>
  }
}

interface JiraChange {
  created: string
  items: Array<{ field: string; fromString?: string; toString?: string }>
}

interface JiraConfig {
  baseUrl: string
  projectKey: string
  email: string
  token: string
  jql: string
}

function getConfig(): JiraConfig {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, '')
  const projectKey = process.env.JIRA_PROJECT_KEY
  const email = process.env.JIRA_USER_EMAIL
  const token = process.env.JIRA_API_TOKEN

  if (!baseUrl || !projectKey || !email || !token) {
    throw new Error('Jira integration is not configured on the server')
  }

  return {
    baseUrl,
    projectKey,
    email,
    token,
    jql:
      process.env.JIRA_JQL ??
      `project = "${projectKey}" AND (statusCategory != Done OR resolved >= -28d) ORDER BY updated DESC`,
  }
}

function authHeader(config: JiraConfig): string {
  return `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`
}

async function jiraFetch(config: JiraConfig, path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: authHeader(config),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Jira authentication or project permissions failed')
    }
    throw new Error(`Jira API request failed (${response.status})`)
  }

  return response
}

async function searchIssues(config: JiraConfig): Promise<JiraSearchIssue[]> {
  const issues: JiraSearchIssue[] = []
  let nextPageToken: string | undefined

  do {
    const response = await jiraFetch(config, '/rest/api/3/search/jql', {
      method: 'POST',
      body: JSON.stringify({
        jql: config.jql,
        maxResults: 100,
        nextPageToken,
        fields: [
          'summary',
          'status',
          'assignee',
          'created',
          'updated',
          'resolutiondate',
          'parent',
          'issuelinks',
        ],
      }),
    })
    const page = (await response.json()) as {
      issues?: JiraSearchIssue[]
      nextPageToken?: string
      isLast?: boolean
    }
    issues.push(...(page.issues ?? []))
    nextPageToken = page.isLast ? undefined : page.nextPageToken
  } while (nextPageToken && issues.length < 500)

  return issues
}

async function getChangelog(config: JiraConfig, issueKey: string): Promise<JiraChange[]> {
  const changes: JiraChange[] = []
  let startAt = 0
  let total = 0

  do {
    const response = await jiraFetch(
      config,
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/changelog?startAt=${startAt}&maxResults=100`,
    )
    const page = (await response.json()) as {
      values?: JiraChange[]
      startAt?: number
      maxResults?: number
      total?: number
    }
    const values = page.values ?? []
    changes.push(...values)
    total = page.total ?? changes.length
    startAt = (page.startAt ?? startAt) + (page.maxResults ?? values.length)
  } while (startAt < total)

  return changes.sort((a, b) => a.created.localeCompare(b.created))
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let cursor = 0

  async function worker() {
    while (cursor < values.length) {
      const index = cursor++
      results[index] = await mapper(values[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()))
  return results
}

function mapStatus(name: string, category?: string): InternalStatus {
  const normalized = name.trim().toLowerCase()
  if (normalized === 'blocked') return 'blocked'
  if (normalized === 'done' || category === 'done') return 'done'
  if (normalized === 'in progress' || normalized === 'in review' || category === 'indeterminate') {
    return 'in_progress'
  }
  return 'todo'
}

function firstStatusDate(changes: JiraChange[], statusNames: string[]): string | undefined {
  const targets = new Set(statusNames.map((name) => name.toLowerCase()))
  return changes
    .flatMap((change) =>
      change.items.map((item) => ({ ...item, created: change.created })),
    )
    .find(
      (item) =>
        item.field.toLowerCase() === 'status' && targets.has(item.toString?.toLowerCase() ?? ''),
    )
    ?.created.slice(0, 10)
}

function lastStatusDate(changes: JiraChange[], statusName: string): string | undefined {
  const target = statusName.toLowerCase()
  return changes
    .flatMap((change) =>
      change.items.map((item) => ({ ...item, created: change.created })),
    )
    .filter(
      (item) => item.field.toLowerCase() === 'status' && item.toString?.toLowerCase() === target,
    )
    .at(-1)
    ?.created.slice(0, 10)
}

function dependencies(issue: JiraSearchIssue, projectKey: string) {
  const blockers = (issue.fields.issuelinks ?? [])
    .filter(
      (link) =>
        !!link.inwardIssue && link.type.inward?.trim().toLowerCase() === 'is blocked by',
    )
    .map((link) => link.inwardIssue!)

  const reason = blockers.length
    ? `Blocked by ${blockers.map((blocker) => `${blocker.key}${blocker.fields?.summary ? ` — ${blocker.fields.summary}` : ''}`).join(', ')}`
    : undefined
  const externalProjects = [
    ...new Set(
      blockers
        .map((blocker) => blocker.key.split('-')[0])
        .filter((key) => key && key !== projectKey),
    ),
  ]

  return {
    reason,
    crossTeamDependency: externalProjects.length ? externalProjects.join(', ') : undefined,
  }
}

async function normalizeIssue(config: JiraConfig, issue: JiraSearchIssue) {
  const changes = await getChangelog(config, issue.key)
  const status = mapStatus(issue.fields.status.name, issue.fields.status.statusCategory?.key)
  const dependency = dependencies(issue, config.projectKey)

  return {
    id: issue.key,
    title: issue.fields.summary,
    status,
    assigneeId: issue.fields.assignee?.accountId ?? 'unassigned',
    assigneeName: issue.fields.assignee?.displayName ?? 'Unassigned',
    epic: issue.fields.parent?.fields?.summary ?? '',
    url: `${config.baseUrl}/browse/${issue.key}`,
    updatedDate: issue.fields.updated.slice(0, 10),
    blockedReason: status === 'blocked' ? dependency.reason ?? 'Blocked in Jira' : undefined,
    blockedSince:
      status === 'blocked'
        ? lastStatusDate(changes, 'Blocked') ?? issue.fields.updated.slice(0, 10)
        : undefined,
    crossTeamDependency: dependency.crossTeamDependency,
    startedDate: firstStatusDate(changes, ['In Progress', 'In Review']),
    doneDate:
      status === 'done'
        ? issue.fields.resolutiondate?.slice(0, 10) ?? lastStatusDate(changes, 'Done')
        : undefined,
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const config = getConfig()
    const rawIssues = await searchIssues(config)
    const issues = await mapWithConcurrency(rawIssues, 5, (issue) => normalizeIssue(config, issue))

    return Response.json(
      { issues, projectKey: config.projectKey, syncedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load Jira issues'
    return Response.json({ error: message }, { status: 502 })
  }
}
