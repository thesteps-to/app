import type { Plan } from "@thesteps/common"
import { loadBilling } from "./billing.ts"

const DRAFTS_KEY = "thesteps.author.drafts"

export interface Draft {
  id: string
  date: string
  plan: Plan
}

export function loadDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Draft[]) : []
  } catch {
    return []
  }
}

export function saveDraft(plan: Plan): Draft {
  const draft: Draft = {
    id: `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    plan,
  }
  const drafts = [draft, ...loadDrafts()]
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  return draft
}

export interface AuthorMetrics {
  /** Plans the user has visited in the discovery flow (fabricated for the demo). */
  started: number
  /** Plans the user has completed end-to-end (fabricated for the demo). */
  completed: number
}

/** Demo metrics per plan id. Clearly fabricated to keep the dashboard non-empty. */
export const DEMO_METRICS: Record<string, AuthorMetrics> = {
  buyahouse: { started: 1247, completed: 234 },
  createmycompany: { started: 892, completed: 156 },
  planmyvacation: { started: 2103, completed: 845 },
}

/** Share of the provider commission paid back to the author of the plan. */
export const AUTHOR_SHARE = 0.3

/** Author remuneration attributed to plans, derived from the local billing log + demo baseline. */
export function authorRemuneration(plans: Plan[]): {
  perPlan: Map<string, number>
  total: number
  demoBaseline: number
} {
  const billing = loadBilling()
  const perPlan = new Map<string, number>()
  for (const plan of plans) {
    const titleMatchAmount = billing
      .filter(entry => entry.planTitle === plan.title)
      .reduce((sum, entry) => sum + entry.amount * AUTHOR_SHARE, 0)
    perPlan.set(plan.id, Math.round(titleMatchAmount))
  }
  const total = [...perPlan.values()].reduce((a, b) => a + b, 0)
  const demoBaseline = plans.reduce((sum, plan) => {
    const metrics = DEMO_METRICS[plan.id]
    if (!metrics) return sum
    return sum + metrics.completed * 6
  }, 0)
  return { perPlan, total, demoBaseline }
}
