import { completion, unlockedSteps } from "@thesteps/common"
import type { Plan, Progress, Step } from "@thesteps/common"

/**
 * Renders a plan with cognitive relief as the driving principle: the default view shows only the
 * next action to perform, prepared as concretely as possible. The full plan is available on
 * demand as a secondary view. Progress is persisted in localStorage under
 * "thesteps.progress.<planId>".
 */
export class StepsPlan extends HTMLElement {

  plan!: Plan
  progress: Progress = { doneSteps: [], checked: {} }

  /** Whether the full plan (secondary view) is displayed instead of the next action. */
  showAll = false

  connectedCallback(): void {
    this.progress = this.loadProgress()
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

  render(): void {
    const plan = this.plan
    const ratio = completion(plan, this.progress)
    const doneCount = this.progress.doneSteps.length
    this.innerHTML = `
      <h1>${plan.title}</h1>
      <p>${plan.summary}</p>
      <div class="progress" role="progressbar" aria-valuenow="${Math.round(ratio * 100)}"
           aria-valuemin="0" aria-valuemax="100"
           title="${doneCount} étape(s) sur ${plan.steps.length}">
        <div style="width: ${ratio * 100}%"></div>
      </div>
      ${this.showAll ? this.renderAll() : this.renderNext()}
    `
    this.querySelector("[data-toggle-view]")?.addEventListener("click", event => {
      event.preventDefault()
      this.showAll = !this.showAll
      this.render()
    })
    for (const button of this.querySelectorAll<HTMLButtonElement>("button[data-step]")) {
      button.addEventListener("click", () => this.toggleStep(button.dataset.step!))
    }
    for (const box of this.querySelectorAll<HTMLInputElement>("input[type=checkbox]")) {
      box.addEventListener("change", () => this.toggleItem(box.dataset.step!, Number(box.dataset.item), box.checked))
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
      ? `<p class="payment">💳 ${step.payment.label}${step.payment.estimate ? ` (${step.payment.estimate})` : ""}</p>`
      : ""
    return `
      <section class="next-card">
        <h2>${step.title}</h2>
        <p>${step.summary}</p>
        ${payment}
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
        <summary>${done ? "✓" : index + 1 + "."} ${step.title}</summary>
        <p>${step.summary}</p>
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
            ${item}
          </label></li>`).join("")}
      </ul>`
  }

  renderProviders(step: Step): string {
    if (!step.providers?.length) return ""
    return `
      <p class="providers">Professionnels à cette étape :
        ${step.providers.map(p => p.url ? `<a href="${p.url}" rel="sponsored">${p.label}</a>` : p.label).join(", ")}
      </p>`
  }
}
