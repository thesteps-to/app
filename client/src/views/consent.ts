import { isFieldShareable, planFields, sharedFields } from "@thesteps/common"
import type { Dossier, DossierField, DossierSensitivity, Plan, ProviderSuggestion, Step } from "@thesteps/common"
import { escapeAttr, escapeHtml } from "../escape.ts"

export interface ConsentRequest {
  plan: Plan
  step: Step
  provider: ProviderSuggestion
  dossier: Dossier
}

export interface ConsentResult {
  level: DossierSensitivity
  fieldIds: string[]
}

const LEVELS: DossierSensitivity[] = ["contact", "project", "financial"]

const LEVEL_LABELS: Record<DossierSensitivity, string> = {
  contact: "Contact",
  project: "Projet",
  financial: "Financier",
}

const LEVEL_DESC: Record<DossierSensitivity, string> = {
  contact: "Nom et e-mail seulement.",
  project: "Détails du projet (sans montants).",
  financial: "Détails du projet et capacité financière.",
}

const IMPACT: Record<DossierSensitivity, string> = {
  contact: "Le professionnel peut seulement vous recontacter.",
  project: "Le professionnel peut vous faire une estimation.",
  financial: "Le professionnel peut vous faire une proposition ferme.",
}

const SHARED_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`
const PROTECTED_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

/** Opens the consent dialog. Resolves with the chosen level + transmitted field ids, or null on cancel. */
export function openConsent(req: ConsentRequest): Promise<ConsentResult | null> {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog")
    dialog.className = "ts-dialog"
    document.body.append(dialog)

    let level: DossierSensitivity = req.dossier.sharing.defaultLevel
    const inputs = planFields(req.plan)
    let settled = false

    const finish = (result: ConsentResult | null): void => {
      if (settled) return
      settled = true
      dialog.close()
      dialog.remove()
      resolve(result)
    }

    const render = (): void => {
      const transmitted = sharedFields(req.dossier, inputs, level)
      const levelIndex = LEVELS.indexOf(level)
      const pct = `${(levelIndex / 2) * 100}%`
      dialog.innerHTML = `
        <div class="ts-action__step" style="margin-bottom: var(--space-sm)">
          <span class="ts-glyph ts-glyph--sm" data-state="current"></span>
          <span class="eyebrow" style="color: var(--brand-text)">Votre accord</span>
        </div>
        <h2 class="ts-dialog__title">Partager votre dossier avec ${escapeHtml(req.provider.label)} ?</h2>
        <p class="ts-dialog__body">
          Motif : ${escapeHtml(req.step.title)}. Vous gardez la main — rien ne sort de votre dossier sans votre accord.
        </p>

        <div class="ts-disclosure" style="margin-top: var(--space-md)">
          <div class="ts-disclosure__head">
            <span class="ts-disclosure__title">Niveau de partage</span>
            <span class="ts-disclosure__value">${LEVEL_LABELS[level]}</span>
          </div>
          <input class="ts-disclosure__range" type="range" min="0" max="2" step="1"
                 value="${levelIndex}" aria-label="Niveau de partage des données"
                 style="--_pct: ${pct}">
          <div class="ts-disclosure__ticks">
            ${LEVELS.map((l, i) => `
              <button type="button" class="ts-disclosure__tick ${i <= levelIndex ? "is-on" : ""}" data-level="${l}">
                <span class="ts-disclosure__tick-label">${LEVEL_LABELS[l]}</span>
              </button>
            `).join("")}
          </div>
          <p class="ts-disclosure__desc">${LEVEL_DESC[level]}</p>
        </div>

        <p class="impact">${IMPACT[level]}</p>

        <div class="field-stack">
          ${inputs.map(field => renderSharedField(field, req.dossier, level, transmitted)).join("")}
        </div>

        <div class="ts-dialog__foot">
          <button class="ts-btn ts-btn--quiet" type="button" data-cancel>Annuler</button>
          <button class="ts-btn ts-btn--primary" type="button" data-confirm
                  ${transmitted.length === 0 ? "disabled" : ""}>
            Je partage ce dossier
          </button>
        </div>
      `

      const range = dialog.querySelector<HTMLInputElement>(".ts-disclosure__range")
      range?.addEventListener("input", () => {
        const idx = parseInt(range.value, 10)
        level = LEVELS[idx] ?? "contact"
        render()
      })
      for (const tick of dialog.querySelectorAll<HTMLButtonElement>(".ts-disclosure__tick")) {
        tick.addEventListener("click", () => {
          level = tick.dataset.level as DossierSensitivity
          render()
        })
      }
      dialog.querySelector<HTMLButtonElement>("[data-cancel]")?.addEventListener("click", () => finish(null))
      dialog.querySelector<HTMLButtonElement>("[data-confirm]")?.addEventListener("click", () => {
        const fieldIds = sharedFields(req.dossier, inputs, level).map(f => f.id)
        finish({ level, fieldIds })
      })
    }

    dialog.addEventListener("cancel", event => {
      event.preventDefault()
      finish(null)
    })
    render()
    dialog.showModal()
  })
}

function renderSharedField(
  field: DossierField,
  dossier: Dossier,
  level: DossierSensitivity,
  transmitted: DossierField[],
): string {
  const willShare = transmitted.some(f => f.id === field.id)
  const allowedAtLevel = isFieldShareable(level, field.sensitivity)
  const value = dossier.values[field.id]
  const hasV = value !== undefined && value !== null && value !== ""
  if (willShare) {
    return `
      <div class="ts-shared" data-shared="true">
        <span class="ts-shared__icon">${SHARED_ICON}</span>
        <span class="ts-shared__body">
          <span class="ts-shared__label">${LEVEL_LABELS[field.sensitivity]} · ${escapeHtml(field.label)}</span>
          <span class="ts-shared__value">${escapeHtml(formatValue(value))}</span>
        </span>
        <span class="ts-shared__state">Partagé</span>
      </div>`
  }
  const reason = !allowedAtLevel
    ? "Au-dessus du niveau choisi"
    : hasV
      ? "Au-dessus du niveau choisi"
      : "Pas encore renseigné"
  return `
    <div class="ts-shared" data-shared="false">
      <span class="ts-shared__icon">${PROTECTED_ICON}</span>
      <span class="ts-shared__body">
        <span class="ts-shared__label">${LEVEL_LABELS[field.sensitivity]} · ${escapeHtml(field.label)}</span>
        <span class="ts-shared__value">${escapeAttr(reason)}</span>
      </span>
      <span class="ts-shared__state">Protégé</span>
    </div>`
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "number") return value.toLocaleString("fr-FR")
  return String(value)
}
