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
      <div class="demo-banner" role="note">
        <strong>Données de démonstration.</strong>
        Plan illustratif ; vos saisies restent locales et ne sont transmises à personne.
      </div>
    `)
  }
  host.insertAdjacentHTML("beforeend", `<p class="secondary"><a href="/plan/${plan.id}">← Revoir la présentation</a></p>`)
  const el = document.createElement("steps-plan") as StepsPlan
  el.plan = plan
  host.append(el)
}
