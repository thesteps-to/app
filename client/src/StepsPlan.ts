import { completion, unlockedSteps } from "@thesteps/common"
import type { Dossier, DossierField, Plan, Progress, ProviderSuggestion, Step } from "@thesteps/common"
import { hasValue, loadDossier, setDossierValue } from "./dossier.ts"
import { addHandoff, handoffsForStep, newHandoffId } from "./handoffs.ts"
import { openConsent } from "./views/consent.ts"
import { escapeAttr, escapeHtml } from "./escape.ts"

/**
 * Renders a plan with cognitive relief as the driving principle: the default view shows only the
 * next actions to perform, with their dossier inputs and provider handoff buttons inline.
 * Progress is per plan ("thesteps.progress.<planId>"). Dossier and handoffs are shared
 * across plans ("thesteps.dossier", "thesteps.handoffs").
 */
export class StepsPlan extends HTMLElement {

  plan!: Plan
  progress: Progress = { doneSteps: [], checked: {} }
  dossier: Dossier = { values: {}, sharing: { defaultLevel: "contact" } }

  /** Whether the full plan (secondary view) is displayed instead of the next action. */
  showAll = false

  connectedCallback(): void {
    this.progress = this.loadProgress()
    this.dossier = loadDossier()
    this.render()
  }

  get storageKey(): string {
    return `thesteps.progress.${this.plan.id}`
  }

  loadProgress(): Progress {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) return JSON.parse(saved) as Progress
    } catch {
      // Corrupted progress: start over.
    }
    return { doneSteps: [], checked: {} }
  }

  saveProgress(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress))
  }

  toggleStep(stepId: string): void {
    const done = this.progress.doneSteps
    this.progress.doneSteps = done.includes(stepId) ? done.filter(id => id !== stepId) : [...done, stepId]
    this.saveProgress()
    this.render()
  }

  toggleItem(stepId: string, index: number, checked: boolean): void {
    const checkedMap = this.progress.checked ?? (this.progress.checked = {})
    const items = new Set(checkedMap[stepId] ?? [])
    if (checked) items.add(index)
    else items.delete(index)
    checkedMap[stepId] = [...items]
    this.saveProgress()
  }

  setFieldValue(fieldId: string, raw: string, type: DossierField["type"]): void {
    const value = type === "number" ? (raw === "" ? "" : Number(raw)) : raw
    this.dossier = setDossierValue(this.dossier, fieldId, value)
  }

  async handoff(step: Step, provider: ProviderSuggestion): Promise<void> {
    const result = await openConsent({ plan: this.plan, step, provider, dossier: this.dossier })
    if (!result) return
    addHandoff({
      id: newHandoffId(),
      planId: this.plan.id,
      stepId: step.id,
      providerType: provider.type,
      level: result.level,
      fields: result.fieldIds,
      date: new Date().toISOString(),
      status: "sent",
    })
    this.render()
  }

  render(): void {
    const plan = this.plan
    const ratio = completion(plan, this.progress)
    const doneCount = this.progress.doneSteps.length
    this.innerHTML = `
      <h1>${escapeHtml(plan.title)}</h1>
      <p>${escapeHtml(plan.summary)}</p>
      <div class="progress" role="progressbar" aria-valuenow="${Math.round(ratio * 100)}"
           aria-valuemin="0" aria-valuemax="100"
           title="${doneCount} étape(s) sur ${plan.steps.length}">
        <div style="width: ${ratio * 100}%"></div>
      </div>
      ${this.showAll ? this.renderAll() : this.renderNext()}
    `
    this.wireEvents()
  }

  wireEvents(): void {
    this.querySelector("[data-toggle-view]")?.addEventListener("click", event => {
      event.preventDefault()
      this.showAll = !this.showAll
      this.render()
    })
    for (const button of this.querySelectorAll<HTMLButtonElement>("button[data-step]")) {
      button.addEventListener("click", () => this.toggleStep(button.dataset.step!))
    }
    for (const box of this.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-step]")) {
      box.addEventListener("change", () => this.toggleItem(box.dataset.step!, Number(box.dataset.item), box.checked))
    }
    for (const input of this.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]")) {
      input.addEventListener("input", () => this.setFieldValue(
        input.dataset.field!,
        input.value,
        input.dataset.type as DossierField["type"],
      ))
      input.addEventListener("change", () => this.setFieldValue(
        input.dataset.field!,
        input.value,
        input.dataset.type as DossierField["type"],
      ))
    }
    for (const button of this.querySelectorAll<HTMLButtonElement>("button[data-handoff-step]")) {
      button.addEventListener("click", () => {
        const stepId = button.dataset.handoffStep!
        const providerType = button.dataset.handoffProvider!
        const step = this.plan.steps.find(s => s.id === stepId)
        const provider = step?.providers?.find(p => p.type === providerType)
        if (step && provider) void this.handoff(step, provider)
      })
    }
  }

  /** Default view: only the unlocked next actions (one card per parallel branch). */
  renderNext(): string {
    const unlocked = unlockedSteps(this.plan, this.progress)
    if (unlocked.length === 0) {
      return `
        <section class="next-card done-card">
          <h2>🎉 Votre projet est terminé !</h2>
          <p>Toutes les étapes de ce plan sont faites. Bravo !</p>
          <p><a href="#" data-toggle-view>Revoir le déroulé complet</a></p>
        </section>`
    }
    const kicker = unlocked.length === 1
      ? `<p class="kicker">Votre prochaine étape</p>`
      : `<p class="kicker">${unlocked.length} étapes peuvent avancer en parallèle</p>`
    const total = this.plan.steps.length
    const doneCount = this.progress.doneSteps.length
    return `
      ${kicker}
      ${unlocked.map(step => this.renderNextCard(step)).join("")}
      <p class="secondary">
        ${doneCount} / ${total} étape(s) faite(s) —
        <a href="#" data-toggle-view>voir le plan complet</a>
      </p>`
  }

  /** Render one card in the next-actions list. */
  renderNextCard(step: Step): string {
    const payment = step.payment
      ? `<p class="payment">💳 ${escapeHtml(step.payment.label)}${step.payment.estimate ? ` (${escapeHtml(step.payment.estimate)})` : ""}</p>`
      : ""
    return `
      <section class="next-card">
        <h2>${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.summary)}</p>
        ${payment}
        ${this.renderDossierForm(step)}
        ${this.renderChecklist(step)}
        ${this.renderProviders(step)}
        <button data-step="${step.id}">C'est fait ✓</button>
      </section>`
  }

  /** Secondary view: every step, expandable, for users who want the details. */
  renderAll(): string {
    return `
      <p class="secondary"><a href="#" data-toggle-view>← Revenir à ma prochaine étape</a></p>
      ${this.plan.steps.map((step, i) => this.renderStep(step, i)).join("")}`
  }

  renderStep(step: Step, index: number): string {
    const done = this.progress.doneSteps.includes(step.id)
    return `
      <details class="${done ? "done" : ""}">
        <summary>${done ? "✓" : index + 1 + "."} ${escapeHtml(step.title)}</summary>
        <p>${escapeHtml(step.summary)}</p>
        ${this.renderChecklist(step)}
        ${this.renderProviders(step)}
        <button data-step="${step.id}">${done ? "Rouvrir cette étape" : "Marquer comme faite"}</button>
      </details>`
  }

  renderChecklist(step: Step): string {
    if (!step.checklist?.length) return ""
    const checked = this.progress.checked?.[step.id] ?? []
    return `
      <ul class="checklist">
        ${step.checklist.map((item, i) => `
          <li><label>
            <input type="checkbox" data-step="${step.id}" data-item="${i}" ${checked.includes(i) ? "checked" : ""}>
            ${escapeHtml(item)}
          </label></li>`).join("")}
      </ul>`
  }

  renderDossierForm(step: Step): string {
    if (!step.inputs?.length) return ""
    return `
      <fieldset class="dossier-inputs">
        <legend>Informations pour votre dossier</legend>
        ${step.inputs.map(field => this.renderField(field)).join("")}
      </fieldset>`
  }

  renderField(field: DossierField): string {
    const value = this.dossier.values[field.id]
    const known = hasValue(this.dossier, field.id)
    const hint = known ? `<span class="known-hint">déjà dans votre dossier</span>` : ""
    const sensitivityTag = `<span class="sensitivity sensitivity-${field.sensitivity}" title="Sensibilité : ${field.sensitivity}">${SENSITIVITY_LABEL[field.sensitivity]}</span>`
    const inputId = `field-${field.id}`
    const common = `id="${inputId}" data-field="${field.id}" data-type="${field.type}"`
    let control: string
    if (field.type === "choice") {
      const choices = field.choices ?? []
      control = `
        <select ${common}>
          <option value="">—</option>
          ${choices.map(choice => `<option value="${escapeAttr(choice)}" ${value === choice ? "selected" : ""}>${escapeHtml(choice)}</option>`).join("")}
        </select>`
    } else {
      const inputType = field.type === "number" ? "number" : "text"
      const val = value === undefined || value === null ? "" : String(value)
      control = `<input type="${inputType}" ${common} value="${escapeAttr(val)}">`
    }
    return `
      <div class="field ${known ? "known" : ""}">
        <label for="${inputId}">${escapeHtml(field.label)} ${sensitivityTag}</label>
        ${control}
        ${hint}
      </div>`
  }

  renderProviders(step: Step): string {
    if (!step.providers?.length) return ""
    const sentTypes = new Set(handoffsForStep(this.plan.id, step.id).map(h => h.providerType))
    return `
      <section class="providers">
        <h3>Professionnels pour cette étape</h3>
        <ul class="provider-list">
          ${step.providers.map(provider => this.renderProvider(step, provider, sentTypes.has(provider.type))).join("")}
        </ul>
      </section>`
  }

  renderProvider(step: Step, provider: ProviderSuggestion, sent: boolean): string {
    const label = provider.url
      ? `<a href="${escapeAttr(provider.url)}" rel="sponsored" data-external>${escapeHtml(provider.label)}</a>`
      : escapeHtml(provider.label)
    const action = sent
      ? `<span class="sent-tag">✓ Dossier envoyé</span>`
      : `<button type="button" data-handoff-step="${step.id}" data-handoff-provider="${escapeAttr(provider.type)}">
           Être mis en relation
         </button>`
    return `<li>${label} ${action}</li>`
  }
}

const SENSITIVITY_LABEL = {
  contact: "contact",
  project: "projet",
  financial: "finances",
} as const
