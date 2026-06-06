import { completion, unlockedSteps } from "@thesteps/common"
import type { Dossier, DossierField, Plan, Progress, ProviderSuggestion, Step } from "@thesteps/common"
import { hasValue, loadDossier, setDossierValue } from "./dossier.ts"
import { addHandoff, handoffsForStep, newHandoffId } from "./handoffs.ts"
import { loadProgress, saveProgress } from "./progress.ts"
import { openConsent } from "./views/consent.ts"
import { escapeAttr, escapeHtml } from "./escape.ts"

/**
 * Execution view for a plan. Default mode shows ONE next-action card per
 * unlocked step (max one branch parallelism), each backed by the .ts-action
 * design-system surface. The full plan (secondary view) shows every step as
 * a trail of details. Dossier and handoffs are shared across plans.
 */
export class StepsPlan extends HTMLElement {

  plan!: Plan
  progress: Progress = { doneSteps: [], checked: {} }
  dossier: Dossier = { values: {}, sharing: { defaultLevel: "contact" } }
  showAll = false

  connectedCallback(): void {
    this.progress = loadProgress(this.plan.id)
    this.dossier = loadDossier()
    this.render()
  }

  toggleStep(stepId: string): void {
    const done = this.progress.doneSteps
    this.progress.doneSteps = done.includes(stepId) ? done.filter(id => id !== stepId) : [...done, stepId]
    saveProgress(this.plan.id, this.progress)
    this.render()
  }

  toggleItem(stepId: string, index: number, checked: boolean): void {
    const checkedMap = this.progress.checked ?? (this.progress.checked = {})
    const items = new Set(checkedMap[stepId] ?? [])
    if (checked) items.add(index)
    else items.delete(index)
    checkedMap[stepId] = [...items]
    saveProgress(this.plan.id, this.progress)
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
    const percent = Math.round(ratio * 100)
    this.innerHTML = `
      <div class="page-eyebrow"><span class="eyebrow">${escapeHtml(plan.needTags[0] ?? "Plan")}</span><span class="rule"></span></div>
      <h1>${escapeHtml(plan.title)}</h1>
      <p>${escapeHtml(plan.summary)}</p>

      <div class="ts-card ts-card--flat progress-card">
        <div class="ts-progress" aria-label="Avancement du plan">
          <div class="ts-progress__track">
            <div class="ts-progress__fill" style="width: ${percent}%"></div>
          </div>
          <div class="ts-progress__label">
            <b>${doneCount} / ${plan.steps.length} étapes faites</b>
            <span>${escapeHtml(plan.title)}</span>
          </div>
        </div>
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

  /** Default view: one next-action card per unlocked step. */
  renderNext(): string {
    const unlocked = unlockedSteps(this.plan, this.progress)
    if (unlocked.length === 0) {
      return `
        <article class="ts-action ts-action--done">
          <div class="ts-action__top">
            <div class="ts-action__step">
              <span class="ts-glyph ts-glyph--sm" data-state="done"></span>
              <span class="eyebrow">Projet terminé</span>
            </div>
          </div>
          <h2 class="ts-action__title">Votre projet est terminé.</h2>
          <p class="ts-action__desc">Toutes les étapes de ce plan sont faites. Bel accomplissement.</p>
          <div class="ts-action__cta">
            <a class="ts-action__detail" href="#" data-toggle-view>Revoir le déroulé complet
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
        </article>`
    }
    const total = this.plan.steps.length
    const doneCount = this.progress.doneSteps.length
    const eyebrow = unlocked.length === 1
      ? `<div class="page-eyebrow"><span class="eyebrow">Votre prochaine étape</span><span class="rule"></span></div>`
      : `<div class="page-eyebrow"><span class="eyebrow">${unlocked.length} étapes peuvent avancer en parallèle</span><span class="rule"></span></div>`
    return `
      ${eyebrow}
      <div class="next-stack">
        ${unlocked.map(step => this.renderNextCard(step)).join("")}
      </div>
      <p class="muted-link" style="margin-top: var(--space-lg); text-align: center">
        ${doneCount} / ${total} étapes faites —
        <a class="muted-link" href="#" data-toggle-view>voir le plan complet</a>
      </p>`
  }

  renderNextCard(step: Step): string {
    const index = this.plan.steps.indexOf(step)
    return `
      <article class="ts-action">
        <div class="ts-action__top">
          <div class="ts-action__step">
            <span class="ts-glyph ts-glyph--sm" data-state="current"></span>
            <span class="eyebrow">Étape ${index + 1} / ${this.plan.steps.length}</span>
          </div>
        </div>
        <h2 class="ts-action__title">${escapeHtml(step.title)}</h2>
        <p class="ts-action__desc">${escapeHtml(step.summary)}</p>
        ${this.renderPayRow(step)}
        ${this.renderDossierForm(step)}
        ${this.renderChecklist(step)}
        ${this.renderProviders(step)}
        <div class="ts-action__cta">
          <button class="ts-btn ts-btn--primary ts-btn--lg ts-btn--block" type="button" data-step="${step.id}">
            C'est fait
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </article>`
  }

  renderPayRow(step: Step): string {
    if (!step.payment) return ""
    const estimate = step.payment.estimate ? ` <b>${escapeHtml(step.payment.estimate)}</b>` : ""
    return `
      <div class="pay-row">
        <span class="ts-pay">💳 ${escapeHtml(step.payment.label)}${estimate ? ` · Estimation${estimate}` : ""}</span>
      </div>`
  }

  /** Secondary view: every step, expandable. */
  renderAll(): string {
    return `
      <p class="muted-link" style="margin-bottom: var(--space-md)">
        <a class="muted-link" href="#" data-toggle-view>← Revenir à ma prochaine étape</a>
      </p>
      <div class="full-plan">
        ${this.plan.steps.map((step, i) => this.renderStep(step, i)).join("")}
      </div>`
  }

  renderStep(step: Step, index: number): string {
    const done = this.progress.doneSteps.includes(step.id)
    const stateLabel = done ? "Faite" : "À faire"
    return `
      <details data-state="${done ? "done" : "node"}">
        <summary>
          <span class="ts-glyph ts-glyph--sm" data-state="${done ? "done" : "node"}"></span>
          <span>Étape ${index + 1} · ${escapeHtml(step.title)}</span>
          <span class="ts-badge ts-badge--${done ? "done" : "neutral"}" aria-hidden="true" style="margin-left:auto">${stateLabel}</span>
        </summary>
        <p>${escapeHtml(step.summary)}</p>
        ${this.renderChecklist(step)}
        ${this.renderProviders(step)}
        <button class="ts-btn ${done ? "ts-btn--quiet" : "ts-btn--secondary"} ts-btn--sm" type="button" data-step="${step.id}">
          ${done ? "Rouvrir cette étape" : "Marquer comme faite"}
        </button>
      </details>`
  }

  renderChecklist(step: Step): string {
    if (!step.checklist?.length) return ""
    const checked = this.progress.checked?.[step.id] ?? []
    return `
      <ul class="checklist">
        ${step.checklist.map((item, i) => `
          <li>
            <label class="ts-check">
              <input type="checkbox" data-step="${step.id}" data-item="${i}" ${checked.includes(i) ? "checked" : ""}>
              <span class="ts-check__box ts-check__box--cb">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <span>${escapeHtml(item)}</span>
            </label>
          </li>`).join("")}
      </ul>`
  }

  renderDossierForm(step: Step): string {
    if (!step.inputs?.length) return ""
    return `
      <fieldset class="dossier-inputs">
        <legend>Informations utiles pour votre dossier</legend>
        ${step.inputs.map(field => this.renderField(field)).join("")}
      </fieldset>`
  }

  renderField(field: DossierField): string {
    const value = this.dossier.values[field.id]
    const known = hasValue(this.dossier, field.id)
    const sensitivityTag = `<span class="ts-tag" title="Sensibilité : ${SENSITIVITY_LABEL[field.sensitivity]}">${SENSITIVITY_LABEL[field.sensitivity]}</span>`
    const inputId = `field-${field.id}`
    const common = `id="${inputId}" data-field="${field.id}" data-type="${field.type}"`
    let control: string
    if (field.type === "choice") {
      const choices = field.choices ?? []
      control = `
        <select class="ts-select" ${common}>
          <option value="">— Choisir —</option>
          ${choices.map(choice => `<option value="${escapeAttr(choice)}" ${value === choice ? "selected" : ""}>${escapeHtml(choice)}</option>`).join("")}
        </select>`
    } else {
      const inputType = field.type === "number" ? "number" : "text"
      const val = value === undefined || value === null ? "" : String(value)
      control = `<input class="ts-input" type="${inputType}" ${common} value="${escapeAttr(val)}">`
    }
    const hint = known
      ? `<span class="ts-hint known-hint">Déjà dans votre dossier.</span>`
      : ""
    return `
      <div class="ts-field">
        <label class="ts-label field-label" for="${inputId}">
          <span>${escapeHtml(field.label)}</span>
          ${sensitivityTag}
        </label>
        ${control}
        ${hint}
      </div>`
  }

  renderProviders(step: Step): string {
    if (!step.providers?.length) return ""
    const sentTypes = new Set(handoffsForStep(this.plan.id, step.id).map(h => h.providerType))
    return `
      <section class="providers-block">
        <h3>Professionnels pour cette étape <span class="ts-sponsored">suggéré</span></h3>
        ${step.providers.map(provider => this.renderProvider(step, provider, sentTypes.has(provider.type))).join("")}
      </section>`
  }

  renderProvider(step: Step, provider: ProviderSuggestion, sent: boolean): string {
    const name = provider.url
      ? `<a class="muted-link" href="${escapeAttr(provider.url)}" rel="sponsored" data-external>${escapeHtml(provider.label)}</a>`
      : `<span>${escapeHtml(provider.label)}</span>`
    const action = sent
      ? `<span class="ts-badge ts-badge--done">Dossier envoyé</span>`
      : `<button class="ts-btn ts-btn--ghost ts-btn--sm" type="button"
                 data-handoff-step="${step.id}"
                 data-handoff-provider="${escapeAttr(provider.type)}">Être mis en relation</button>`
    return `
      <div class="provider-row">
        <span class="grow"><strong>${name}</strong> <span class="ts-tag">${escapeHtml(provider.type)}</span></span>
        ${action}
      </div>`
  }
}

const SENSITIVITY_LABEL = {
  contact: "Contact",
  project: "Projet",
  financial: "Finances",
} as const
