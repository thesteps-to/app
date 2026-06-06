/**
 * @typedef {Object} ProviderSuggestion
 * @property {string} type Provider category (e.g. "courtier", "notaire").
 * @property {string} label Human-readable label, in the plan's language.
 * @property {string} [url] Affiliate/partner link, if any.
 *
 * @typedef {Object} Step
 * @property {string} id Unique step id within the plan (kebab-case).
 * @property {string} title
 * @property {string} summary What this step is about and why it matters.
 * @property {string[]} [checklist] Concrete items the user can tick.
 * @property {ProviderSuggestion[]} [providers] Suggested external providers.
 *
 * @typedef {Object} Plan
 * @property {string} id Plan id, also its URL slug (e.g. "buyahouse").
 * @property {string} title
 * @property {string} lang BCP 47 language tag of the content (e.g. "fr").
 * @property {string} summary
 * @property {Step[]} steps
 */

/**
 * Validate raw plan data and return it as a frozen Plan.
 *
 * @param {any} data
 * @returns {Plan}
 * @throws {TypeError} If the data does not describe a valid plan.
 */
export function createPlan(data) {
  if (!data || typeof data !== "object") throw new TypeError("Plan data must be an object")
  for (const field of ["id", "title", "lang", "summary"]) {
    if (typeof data[field] !== "string" || !data[field]) {
      throw new TypeError(`Plan "${field}" must be a non-empty string`)
    }
  }
  if (!Array.isArray(data.steps) || data.steps.length < 1) {
    throw new TypeError("Plan must have at least one step")
  }
  const ids = new Set()
  for (const step of data.steps) {
    if (typeof step.id !== "string" || !step.id) throw new TypeError("Step id must be a non-empty string")
    if (ids.has(step.id)) throw new TypeError(`Duplicate step id "${step.id}"`)
    ids.add(step.id)
    if (typeof step.title !== "string" || !step.title) {
      throw new TypeError(`Step "${step.id}" title must be a non-empty string`)
    }
  }
  return Object.freeze(data)
}

/**
 * Progress of a user in a plan: ids of completed steps and checked items.
 *
 * @typedef {Object} Progress
 * @property {string[]} doneSteps Completed step ids.
 * @property {Record<string, number[]>} [checked] Checked checklist item indexes, per step id.
 */

/**
 * @param {Plan} plan
 * @param {Progress} progress
 * @returns {number} Completion ratio between 0 and 1.
 */
export function completion(plan, progress) {
  const done = plan.steps.filter(step => progress.doneSteps.includes(step.id)).length
  return done / plan.steps.length
}

/**
 * @param {Plan} plan
 * @param {Progress} progress
 * @returns {Step | undefined} The first step not done yet, or undefined if the plan is complete.
 */
export function nextStep(plan, progress) {
  return plan.steps.find(step => !progress.doneSteps.includes(step.id))
}
