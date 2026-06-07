import { completion, unlockedSteps } from "@thesteps/common"
import type { Dossier, DossierField, Handoff, Plan, Progress, ProviderSuggestion, Step } from "@thesteps/common"
import { hasValue, loadDossier, setDossierValue } from "./dossier.ts"
import { addHandoff, handoffsForStep, newHandoffId } from "./handoffs.ts"
import { loadProgress, saveProgress } from "./progress.ts"
import { openConsent } from "./views/consent.ts"
import { escapeAttr, escapeHtml } from "./escape.ts"

const CHEVRON_SVG = `<svg class="ts-record__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`

const DOC_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`

const CHECK_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`

const WHEN_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" })

/**
 * Execution view for a plan. Renders every step as a single ts-trail: past
 * steps fold into ts-record (inputs read-back + handoffs delivered), the
 * current step(s) explode into a ts-focal action card, locked steps stay as
 * a discreet ts-trail__body with their unlock reason. On render, the first
 * current step is scrolled into view so the user lands exactly where they
 * left off.
 */
export class StepsPlan extends HTMLElement {

  plan!: Plan
  progress: Progress = { doneSteps: [], checked: {}, doneAt: {} }
  dossier: Dossier = { values: {}, sharing: { defaultLevel: "contact" } }
  private lastFocalStepId: string | null = null

  connectedCallback(): void {
    this.progress = loadProgress(this.plan.id)
    this.dossier = loadDossier()
    this.render()
  }

  toggleStep(stepId: string): void {
    const done = this.progress.doneSteps
    const willBeDone = !done.includes(stepId)
    this.progress.doneSteps = willBeDone ? [...done, stepId] : done.filter(id => id !== stepId)
    const doneAt = this.progress.doneAt ?? (this.progress.doneAt = {})
    if (willBeDone) doneAt[stepId] = new Date().toISOString()
    else delete doneAt[stepId]
    this.lastFocalStepId = null  // current step will change, allow scroll
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

      ${this.renderTrail()}
    `
    this.wireEvents()
    this.scrollToCurrent()
  }

  wireEvents(): void {
    for (const button of this.querySelectorAll<HTMLButtonElement>("button[data-step]")) {
      button.addEventListener("click", () => this.toggleStep(button.dataset.step!))
    }
    for (const box of this.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-step-check]")) {
      box.addEventListener("change", () => this.toggleItem(
        box.dataset.stepCheck!,
        Number(box.dataset.item),
        box.checked,
      ))
    }
    for (const input of this.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]")) {
      const handler = (): void => this.setFieldValue(
        input.dataset.field!,
        input.value,
        input.dataset.type as DossierField["type"],
      )
      input.addEventListener("input", handler)
      input.addEventListener("change", handler)
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

  scrollToCurrent(): void {
    const current = this.querySelector<HTMLElement>('li.ts-trail__item[data-state="current"]')
    const id = current?.dataset.stepId ?? null
    if (current && id !== this.lastFocalStepId) {
      this.lastFocalStepId = id
      requestAnimationFrame(() => {
        current.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } else if (!current) {
      this.lastFocalStepId = null
    }
  }

  renderTrail(): string {
    const doneSet = new Set(this.progress.doneSteps)
    const unlockedSet = new Set(unlockedSteps(this.plan, this.progress).map(s => s.id))
    return `
      <ol class="ts-trail">
        ${this.plan.steps.map((step, i) => this.renderTrailItem(step, i, doneSet, unlockedSet)).join("")}
      </ol>
    `
  }

  renderTrailItem(step: Step, index: number, doneSet: Set<string>, unlockedSet: Set<string>): string {
    const isLast = index === this.plan.steps.length - 1
    const isDone = doneSet.has(step.id)
    const isCurrent = !isDone && unlockedSet.has(step.id)
    const state = isDone ? "done" : isCurrent ? "current" : "locked"
    const below = isLast ? "" : `data-below="${isDone ? "taken" : "future"}"`
    const body = isDone
      ? this.renderRecord(step)
      : isCurrent
        ? this.renderFocal(step, index)
        : this.renderLocked(step)
    return `
      <li class="ts-trail__item" data-state="${state}" ${below} data-step-id="${escapeAttr(step.id)}">
        <span class="ts-trail__rail"><span class="ts-glyph" data-state="${state}"></span></span>
        ${body}
      </li>
    `
  }

  /** A completed step: title + when, expandable into inputs read-back and handoffs. */
  renderRecord(step: Step): string {
    const whenIso = this.progress.doneAt?.[step.id]
    const whenLabel = whenIso ? `Fait le ${formatWhen(whenIso)}` : "Étape faite"
    const filled = (step.inputs ?? [])
      .map(field => ({ field, value: this.dossier.values[field.id] }))
      .filter(({ value }) => value !== undefined && value !== null && value !== "")
    const handoffs = handoffsForStep(this.plan.id, step.id)
    return `
      <details class="ts-record">
        <summary class="ts-record__head">
          <span class="ts-record__titles">
            <p class="ts-record__title">${escapeHtml(step.title)}</p>
            <span class="ts-record__when">${escapeHtml(whenLabel)}</span>
          </span>
          ${CHEVRON_SVG}
        </summary>
        <div class="ts-record__body">
          ${filled.length ? this.renderRecordFields(filled) : ""}
          ${handoffs.length ? this.renderRecordHandoffs(step, handoffs) : ""}
          <button class="ts-btn ts-btn--quiet ts-btn--sm" type="button" data-step="${escapeAttr(step.id)}">Rouvrir cette étape</button>
        </div>
      </details>
    `
  }

  renderRecordFields(filled: Array<{ field: DossierField; value: unknown }>): string {
    return `
      <div class="ts-record__fields">
        <span class="ts-record__sub">Ce que vous avez indiqué</span>
        ${filled.map(({ field, value }) => `
          <div class="ts-record__kv">
            <span class="ts-record__k">${escapeHtml(field.label)}</span>
            <span class="ts-record__v">${escapeHtml(formatValue(value))}</span>
          </div>
        `).join("")}
      </div>
    `
  }

  renderRecordHandoffs(step: Step, handoffs: Handoff[]): string {
    return `
      <div>
        <span class="ts-record__sub">Livrables</span>
        <div class="ts-docs">
          ${handoffs.map(h => this.renderHandoffDoc(step, h)).join("")}
        </div>
      </div>
    `
  }

  renderHandoffDoc(step: Step, handoff: Handoff): string {
    const providerLabel = step.providers?.find(p => p.type === handoff.providerType)?.label ?? handoff.providerType
    const status = handoff.status === "concluded" ? "Affaire conclue" : "Dossier envoyé"
    return `
      <span class="ts-doc">
        <span class="ts-doc__icon">${DOC_ICON_SVG}</span>
        <span>
          <span class="ts-doc__name">${escapeHtml(providerLabel)}</span>
          <span class="ts-doc__meta">${escapeHtml(status)} · ${escapeHtml(formatWhen(handoff.date))}</span>
        </span>
      </span>
    `
  }

  /** Current step: the loud focal action card. */
  renderFocal(step: Step, index: number): string {
    const total = this.plan.steps.length
    return `
      <div class="ts-focal">
        <div class="ts-focal__eyebrow">
          <span class="eyebrow">Vous êtes ici · étape ${index + 1} / ${total}</span>
        </div>
        <h2 class="ts-focal__title">${escapeHtml(step.title)}</h2>
        <p class="ts-focal__desc">${escapeHtml(step.summary)}</p>
        ${this.renderPayRow(step)}
        ${this.renderDossierForm(step)}
        ${this.renderChecklist(step)}
        ${this.renderProviders(step)}
        <button class="ts-btn ts-btn--primary ts-btn--block" type="button" data-step="${escapeAttr(step.id)}">
          C'est fait
          ${CHECK_SVG}
        </button>
      </div>
    `
  }

  /** Future step: the quiet "not yet — disponible après X" row. */
  renderLocked(step: Step): string {
    const reason = this.lockedReason(step)
    return `
      <div class="ts-trail__body">
        <p class="ts-trail__title">${escapeHtml(step.title)}</p>
        ${reason ? `<div class="ts-trail__meta"><span class="ts-trail__reason">${escapeHtml(reason)}</span></div>` : ""}
      </div>
    `
  }

  lockedReason(step: Step): string {
    const reqs = step.requires ?? []
    if (reqs.length === 0) return ""
    const titles = reqs
      .map(id => this.plan.steps.find(s => s.id === id)?.title)
      .filter((title): title is string => Boolean(title))
    if (titles.length === 0) return ""
    return `Disponible après : ${titles.join(" · ")}`
  }

  renderPayRow(step: Step): string {
    if (!step.payment) return ""
    const estimate = step.payment.estimate ? ` <b>${escapeHtml(step.payment.estimate)}</b>` : ""
    return `
      <div class="ts-focal__meta">
        <span class="ts-pay">💳 ${escapeHtml(step.payment.label)}${estimate ? ` · Estimation${estimate}` : ""}</span>
      </div>`
  }

  renderChecklist(step: Step): string {
    if (!step.checklist?.length) return ""
    const checked = this.progress.checked?.[step.id] ?? []
    return `
      <ul class="checklist">
        ${step.checklist.map((item, i) => `
          <li>
            <label class="ts-check">
              <input type="checkbox" data-step-check="${escapeAttr(step.id)}" data-item="${i}" ${checked.includes(i) ? "checked" : ""}>
              <span class="ts-check__box ts-check__box--cb">${CHECK_SVG}</span>
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

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return WHEN_FORMATTER.format(d)
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return new Intl.NumberFormat("fr-FR").format(value)
  return String(value)
}