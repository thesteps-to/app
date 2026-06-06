export interface ProviderSuggestion {
  /** Provider category (e.g. "courtier", "notaire"). */
  type: string
  /** Human-readable label, in the plan's language. */
  label: string
  /** Affiliate/partner link, if any. */
  url?: string
}

export interface Step {
  /** Unique step id within the plan (kebab-case). */
  id: string
  title: string
  /** What this step is about and why it matters. */
  summary: string
  /** Concrete items the user can tick. */
  checklist?: string[]
  /** Suggested external providers. */
  providers?: ProviderSuggestion[]
}

export interface Plan {
  /** Plan id, also its URL slug (e.g. "buyahouse"). */
  id: string
  title: string
  /** BCP 47 language tag of the content (e.g. "fr"). */
  lang: string
  summary: string
  steps: Step[]
}

/** Progress of a user in a plan: ids of completed steps and checked items. */
export interface Progress {
  /** Completed step ids. */
  doneSteps: string[]
  /** Checked checklist item indexes, per step id. */
  checked?: Record<string, number[]>
}

/** Validate raw plan data and return it as a frozen Plan. */
export function createPlan(data: unknown): Plan {
  if (!data || typeof data !== "object") throw new TypeError("Plan data must be an object")
  const raw = data as Record<string, unknown>
  for (const field of ["id", "title", "lang", "summary"] as const) {
    if (typeof raw[field] !== "string" || !raw[field]) {
      throw new TypeError(`Plan "${field}" must be a non-empty string`)
    }
  }
  if (!Array.isArray(raw.steps) || raw.steps.length < 1) {
    throw new TypeError("Plan must have at least one step")
  }
  const ids = new Set<string>()
  for (const step of raw.steps as Step[]) {
    if (typeof step.id !== "string" || !step.id) throw new TypeError("Step id must be a non-empty string")
    if (ids.has(step.id)) throw new TypeError(`Duplicate step id "${step.id}"`)
    ids.add(step.id)
    if (typeof step.title !== "string" || !step.title) {
      throw new TypeError(`Step "${step.id}" title must be a non-empty string`)
    }
  }
  return Object.freeze(data as Plan)
}

/** Completion ratio between 0 and 1. */
export function completion(plan: Plan, progress: Progress): number {
  const done = plan.steps.filter(step => progress.doneSteps.includes(step.id)).length
  return done / plan.steps.length
}

/** The first step not done yet, or undefined if the plan is complete. */
export function nextStep(plan: Plan, progress: Progress): Step | undefined {
  return plan.steps.find(step => !progress.doneSteps.includes(step.id))
}