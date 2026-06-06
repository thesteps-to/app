import { completion } from "@thesteps/common"

/**
 * Renders a plan as a list of expandable steps with checklists and provider suggestions.
 * Progress is persisted in localStorage under "thesteps.progress.<planId>".
 */
export class StepsPlan extends HTMLElement {

  /** @type {import("@thesteps/common").Plan} */
  plan

  connectedCallback() {
    this.progress = this.loadProgress()
    this.render()
  }

  get storageKey() {
    return `thesteps.progress.${this.plan.id}`
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) return JSON.parse(saved)
    } catch {
      // Corrupted progress: start over.
    }
    return { doneSteps: [], checked: {} }
  }

  saveProgress() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress))
  }

  toggleStep(stepId) {
    const done = this.progress.doneSteps
    this.progress.doneSteps = done.includes(stepId) ? done.filter(id => id !== stepId) : [...done, stepId]
    this.saveProgress()
    this.render()
  }

  toggleItem(stepId, index, checked) {
    const items = new Set(this.progress.checked[stepId] ?? [])
    checked ? items.add(index) : items.delete(index)
    this.progress.checked[stepId] = [...items]
    this.saveProgress()
  }

  render() {
    const plan = this.plan
    const ratio = completion(plan, this.progress)
    this.innerHTML = `
      <h1>${plan.title}</h1>
      <p>${plan.summary}</p>
      <div class="progress" role="progressbar" aria-valuenow="${Math.round(ratio * 100)}"
           aria-valuemin="0" aria-valuemax="100">
        <div style="width: ${ratio * 100}%"></div>
      </div>
      ${plan.steps.map((step, i) => this.renderStep(step, i)).join("")}
    `
    for (const button of this.querySelectorAll("button[data-step]")) {
      button.addEventListener("click", () => this.toggleStep(button.dataset.step))
    }
    for (const box of this.querySelectorAll("input[type=checkbox]")) {
      box.addEventListener("change", () => this.toggleItem(box.dataset.step, Number(box.dataset.item), box.checked))
    }
  }

  renderStep(step, index) {
    const done = this.progress.doneSteps.includes(step.id)
    const checked = this.progress.checked?.[step.id] ?? []
    const checklist = step.checklist?.length ? `
      <ul class="checklist">
        ${step.checklist.map((item, i) => `
          <li><label>
            <input type="checkbox" data-step="${step.id}" data-item="${i}" ${checked.includes(i) ? "checked" : ""}>
            ${item}
          </label></li>`).join("")}
      </ul>` : ""
    const providers = step.providers?.length ? `
      <p class="providers">Professionnels à cette étape :
        ${step.providers.map(p => p.url ? `<a href="${p.url}" rel="sponsored">${p.label}</a>` : p.label).join(", ")}
      </p>` : ""
    return `
      <details class="${done ? "done" : ""}" ${!done && this.isNext(step) ? "open" : ""}>
        <summary>${done ? "✓" : index + 1 + "."} ${step.title}</summary>
        <p>${step.summary}</p>
        ${checklist}
        ${providers}
        <button data-step="${step.id}">${done ? "Rouvrir cette étape" : "Marquer comme faite"}</button>
      </details>`
  }

  isNext(step) {
    return this.plan.steps.find(s => !this.progress.doneSteps.includes(s.id))?.id === step.id
  }
}
