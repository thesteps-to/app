import { planFields, sharedFields } from "@thesteps/common"
import type { Dossier, DossierSensitivity, Plan, ProviderSuggestion, Step } from "@thesteps/common"
import { escapeHtml } from "../escape.ts"

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
  contact: "Coordonnées seulement",
  project: "Coordonnées + projet",
  financial: "Coordonnées + projet + finances",
}

const IMPACT: Record<DossierSensitivity, string> = {
  contact: "Avec ce niveau, le professionnel peut seulement vous recontacter.",
  project: "Avec ce niveau, le professionnel peut vous faire une estimation.",
  financial: "Avec ce niveau, le professionnel peut vous faire une proposition ferme.",
}

/** Opens the consent dialog. Resolves with the chosen level + transmitted field ids, or null on cancel. */
export function openConsent(req: ConsentRequest): Promise<ConsentResult | null> {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog")
    dialog.className = "consent-dialog"
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
      const shared = sharedFields(req.dossier, inputs, level)
      dialog.innerHTML = `
        <article>
          <p class="kicker">Mise en relation</p>
          <h2>Transmettre votre dossier à ${escapeHtml(req.provider.label)}</h2>
          <p class="purpose">Motif : ${escapeHtml(req.step.title)}</p>
          <fieldset class="disclosure-slider">
            <legend>Niveau de divulgation</legend>
            ${LEVELS.map(l => `
              <label>
                <input type="radio" name="level" value="${l}" ${l === level ? "checked" : ""}>
                <span>${LEVEL_LABELS[l]}</span>
              </label>
            `).join("")}
          </fieldset>
          <p class="impact">${IMPACT[level]}</p>
          <section class="shared-fields">
            <h3>${shared.length === 0 ? "Aucune donnée du dossier transmise" : `Données transmises (${shared.length})`}</h3>
            ${shared.length === 0
              ? `<p class="empty">Renseignez les champs du dossier pour partager plus d'informations.</p>`
              : `<ul>${shared.map(f => `
                <li>
                  <span class="field-label">${escapeHtml(f.label)}</span>
                  <span class="field-value">${escapeHtml(formatValue(req.dossier.values[f.id]))}</span>
                </li>`).join("")}</ul>`}
          </section>
          <div class="dialog-buttons">
            <button type="button" data-cancel>Annuler</button>
            <button type="button" data-confirm class="primary" ${shared.length === 0 ? "disabled" : ""}>
              Transmettre le dossier
            </button>
          </div>
        </article>
      `
      for (const radio of dialog.querySelectorAll<HTMLInputElement>("input[name=level]")) {
        radio.addEventListener("change", () => {
          level = radio.value as DossierSensitivity
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") return value.toLocaleString("fr-FR")
  return String(value)
}
