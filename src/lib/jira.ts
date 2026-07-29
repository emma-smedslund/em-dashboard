import type { JiraIssue } from '../types'
import type { StatusLevel } from '../components/StatusPill'

const FALLBACK_STATUS_NAME: Record<JiraIssue['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

const STATUS_LEVEL: Record<JiraIssue['status'], StatusLevel> = {
  todo: 'neutral',
  in_progress: 'warning',
  blocked: 'critical',
  done: 'good',
}

export function getJiraStatus(issue: JiraIssue): { label: string; level: StatusLevel } {
  return {
    label: issue.statusName?.trim() || FALLBACK_STATUS_NAME[issue.status],
    level: STATUS_LEVEL[issue.status],
  }
}

// Accept either a Jira key or a copied browse URL. Jira's numeric issue part
// has no meaningful leading zeroes, so TFP-02 resolves to the canonical TFP-2.
export function normalizeJiraIssueKey(input: string): string {
  const trimmed = input.trim()
  let candidate = trimmed

  try {
    const url = new URL(trimmed)
    const browseMatch = url.pathname.match(/\/browse\/([^/?#]+)/i)
    if (browseMatch) candidate = browseMatch[1]
  } catch {
    // Plain issue keys are expected and do not need URL parsing.
  }

  const match = candidate.toUpperCase().match(/^([A-Z][A-Z0-9_]*)-(\d+)$/)
  if (!match) return candidate.toUpperCase()
  return `${match[1]}-${Number(match[2])}`
}
