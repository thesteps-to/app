export interface ProviderSuggestion {
  /** Provider category (e.g. "courtier", "notaire"). */
  type: string
  /** Human-readable label, in the plan's language. */
  label: string
  /** Affiliate/partner link, if any. */
  url?: string
}

export type DossierFieldType = "text" | "number" | "choice"
export type DossierSensitivity = "contact" | "project" | "financial"

export interface DossierField {
  /** Stable id, shared across steps and plans: same id = same dossier entry. */
  id: string
  label: string
  type: DossierFieldType
  /** Allowed values for type "choice". */
  choices?: string[]
  sensitivity: DossierSensitivity
}

export interface Payment {
  label: string
  /** Free-form price hint, e.g. "from 500 €". */
  estimate?: string
}

export interface Step {
  /** Unique step id within the plan (kebab-case). */
  id: string
  title: string
  summary: string
  checklist?: string[]
  providers?: ProviderSuggestion[]
  /** Ids of steps that must be done first. Builds a DAG. */
  requires?: string[]
  /** Paid service performed at this step. */
  payment?: Payment
  /** Dossier fields collected at this step. */
  inputs?: DossierField[]
}

export interface Author {
  id: string
  name: string
  bio?: string
  /** Author's explainer/marketing video for plans they wrote. */
  videoUrl?: string
}

export interface Rating {
  /** Average between 0 and 5. */
  average: number
  count: number
}

export interface Review {
  /** Reviewer display name. */
  author: string
  text: string
  /** ISO 8601 date. */
  date: string
}

export interface Plan {
  /** Plan id, also its URL slug (e.g. "buyahouse"). */
  id: string
  title: string
  /** BCP 47 language tag of the content (e.g. "fr"). */
  lang: string
  summary: string
  author: Author
  steps: Step[]
  /** Tags used by discovery to match free-text needs. */
  needTags: string[]
  rating?: Rating
  reviews?: Review[]
  /** True if this plan is demo content only (UI must label it). */
  demo?: boolean
}

export interface SharingPreferences {
  defaultLevel: DossierSensitivity
  /** Per-provider override of the default sharing level, keyed by provider id/type. */
  perProvider?: Record<string, DossierSensitivity>
}

export interface Dossier {
  values: Record<string, unknown>
  sharing: SharingPreferences
}

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
  validateAuthor(raw.author)
  if (!Array.isArray(raw.needTags) || raw.needTags.some(t => typeof t !== "string")) {
    throw new TypeError(`Plan "needTags" must be an array of strings`)
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
  validateDag(raw.steps as Step[], ids)
  return Object.freeze(data as Plan)
}

function validateAuthor(value: unknown): void {
  if (!value || typeof value !== "object") {
    throw new TypeError(`Plan "author" must be an object`)
  }
  const author = value as Record<string, unknown>
  for (const field of ["id", "name"] as const) {
    if (typeof author[field] !== "string" || !author[field]) {
      throw new TypeError(`Plan author "${field}" must be a non-empty string`)
    }
  }
}

function validateDag(steps: Step[], ids: Set<string>): void {
  for (const step of steps) {
    for (const ref of step.requires ?? []) {
      if (!ids.has(ref)) {
        throw new TypeError(`Step "${step.id}" requires unknown step "${ref}"`)
      }
    }
  }
  const byId = new Map(steps.map(s => [s.id, s]))
  const color = new Map<string, 0 | 1 | 2>()
  const visit = (id: string, path: string[]): void => {
    const c = color.get(id) ?? 0
    if (c === 2) return
    if (c === 1) {
      const start = path.indexOf(id)
      const cycle = [...path.slice(start), id].join(" → ")
      throw new TypeError(`Cycle in step requires: ${cycle}`)
    }
    color.set(id, 1)
    for (const ref of byId.get(id)!.requires ?? []) visit(ref, [...path, id])
    color.set(id, 2)
  }
  for (const step of steps) visit(step.id, [])
}

/** Completion ratio between 0 and 1. */
export function completion(plan: Plan, progress: Progress): number {
  const done = plan.steps.filter(step => progress.doneSteps.includes(step.id)).length
  return done / plan.steps.length
}

/** Steps whose requirements are all done and which are not done themselves. */
export function unlockedSteps(plan: Plan, progress: Progress): Step[] {
  const done = new Set(progress.doneSteps)
  return plan.steps.filter(step => {
    if (done.has(step.id)) return false
    return (step.requires ?? []).every(id => done.has(id))
  })
}

/** First unlocked step, preserving plan order. Equivalent to the linear "next step". */
export function nextStep(plan: Plan, progress: Progress): Step | undefined {
  return unlockedSteps(plan, progress)[0]
}

/** All dossier fields needed across the given plans, deduplicated by field id (first occurrence wins). */
export function planFields(...plans: Plan[]): DossierField[] {
  const seen = new Map<string, DossierField>()
  for (const plan of plans) {
    for (const step of plan.steps) {
      for (const field of step.inputs ?? []) {
        if (!seen.has(field.id)) seen.set(field.id, field)
      }
    }
  }
  return [...seen.values()]
}

/** Empty dossier with sharing defaulting to the lowest sensitivity. */
export function emptyDossier(): Dossier {
  return { values: {}, sharing: { defaultLevel: "contact" } }
}
