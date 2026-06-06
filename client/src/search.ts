import type { Plan } from "@thesteps/common"

const TAG_WEIGHT = 3
const TITLE_WEIGHT = 2
const SUMMARY_WEIGHT = 1

/** Naive scoring: needTag hits weigh most, then title, then summary. Rating used as tiebreaker. */
export function rank(plans: Plan[], query: string): Plan[] {
  const q = normalize(query)
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return [...plans].sort(byRating)
  }
  const scored = plans
    .map(plan => ({ plan, score: scorePlan(plan, words) }))
    .filter(entry => entry.score > 0)
  scored.sort((a, b) => b.score - a.score || byRating(a.plan, b.plan))
  return scored.map(entry => entry.plan)
}

function scorePlan(plan: Plan, words: string[]): number {
  const tags = plan.needTags.map(normalize)
  const title = normalize(plan.title)
  const summary = normalize(plan.summary)
  let score = 0
  for (const word of words) {
    if (tags.some(tag => tag.includes(word))) score += TAG_WEIGHT
    if (title.includes(word)) score += TITLE_WEIGHT
    if (summary.includes(word)) score += SUMMARY_WEIGHT
  }
  return score
}

function byRating(a: Plan, b: Plan): number {
  return (b.rating?.average ?? 0) - (a.rating?.average ?? 0)
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}
