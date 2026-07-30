import type { AIInsight, SlackMessage } from '../types'
import { daysBetween, toISODate } from './date'

const UNANSWERED_DAYS = 3

function evidence(message: SlackMessage) {
  return {
    type: 'slack' as const,
    refId: message.id,
    label: `${message.channel}, ${message.authorName} — ${message.text}`,
  }
}

/** Deterministic MVP rules over live Slack messages. */
export function generateSlackInsights(
  messages: SlackMessage[],
  referenceDate = new Date(),
): AIInsight[] {
  const insights: AIInsight[] = []
  const today = toISODate(referenceDate)
  const deployProblems = messages.filter(
    (message) =>
      message.channel === '#platform-release' &&
      /(deploy|deployment|pipeline|release)/i.test(message.text) &&
      /(timeout|timed out|stuck|failed|failure|error)/i.test(message.text),
  )

  if (deployProblems.length >= 3) {
    insights.push({
      id: `slack-recurring-release-${deployProblems.map((message) => message.id).sort().join('-')}`,
      category: 'recurring_issue',
      title: `Release problems appeared in ${deployProblems.length} Slack messages over two weeks`,
      summary: `Similar deploy or pipeline problems were mentioned ${deployProblems.length} times in #platform-release during the current 14-day window.`,
      sources: deployProblems.slice(0, 6).map(evidence),
      confidence: deployProblems.length >= 4 ? 'high' : 'medium',
      recommendedAction: 'Review the recurring release failures and decide whether to create a focused improvement action',
      status: 'new',
    })
  }

  const unansweredQuestions = messages
    .filter(
      (message) =>
        ['#platform-help', '#platform-team'].includes(message.channel) &&
        message.replyCount === 0 &&
        /\?|\b(who|what|when|where|why|how|can someone|does anyone)\b/i.test(message.text),
    )
    .map((message) => ({
      message,
      age: daysBetween(message.timestamp.slice(0, 10), today),
    }))
    .filter(({ age }) => age >= UNANSWERED_DAYS)
    .sort((a, b) => b.age - a.age)

  if (unansweredQuestions.length > 0) {
    const { message, age } = unansweredQuestions[0]
    insights.push({
      id: `slack-unanswered-${message.id}`,
      category: 'unresolved_question',
      title: `A Slack question has had no replies for ${age} days`,
      summary: `${message.authorName} posted a question in ${message.channel} that has no recorded replies.`,
      sources: [evidence(message)],
      confidence: age >= 5 ? 'high' : 'medium',
      recommendedAction: `Clarify ownership or answer the open question in ${message.channel}`,
      status: 'new',
    })
  }

  return insights
}
