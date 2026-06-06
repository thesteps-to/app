import { getPlan } from "../catalog.ts"
import { renderNotFound } from "./notFound.ts"
import type { StepsPlan } from "../StepsPlan.ts"

export async function renderExecution(host: HTMLElement, id: string): Promise<void> {
  host.innerHTML = `<p class="loading">Chargement du plan…</p>`
  const plan = await getPlan(id)
  if (!plan) return renderNotFound(host)
  document.title = `${plan.title} — thesteps.to`
  host.innerHTML = ""
  if (plan.demo) {
    host.insertAdjacentHTML("beforeend", `
      <div class="ts-banner ts-banner--demo" role="note">
        <span class="ts-banner__dot"></span>
        <div class="ts-banner__body">
          <b>Données de démonstration.</b>
          <p>Vos saisies restent sur cet appareil ; rien n'est transmis sans votre accord.</p>
        </div>
      </div>
    `)
  }
  host.insertAdjacentHTML("beforeend",
    `<p style="margin: var(--space-md) 0"><a class="muted-link" href="/plan/${plan.id}">← Revoir la présentation</a></p>`)
  const el = document.createElement("steps-plan") as StepsPlan
  el.plan = plan
  host.append(el)
}
