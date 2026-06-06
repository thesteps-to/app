import { createPlan } from "@thesteps/common"
import { StepsPlan } from "./StepsPlan.ts"

customElements.define("steps-plan", StepsPlan)

const DEFAULT_PLAN = "buyahouse"

async function render(): Promise<void> {
  const app = document.getElementById("app")
  if (!app) return
  const slug = location.pathname.replaceAll("/", "") || DEFAULT_PLAN
  try {
    const response = await fetch(`/plans/${slug}.json`)
    if (!response.ok) throw new Error(`Plan "${slug}" not found`)
    const plan = createPlan(await response.json())
    document.title = `${plan.title} — thesteps.to`
    const el = document.createElement("steps-plan") as StepsPlan
    el.plan = plan
    app.replaceChildren(el)
  } catch (error) {
    console.error(error)
    app.innerHTML = `<h1>Plan introuvable</h1>
      <p>Le plan demandé n'existe pas (encore). <a href="/${DEFAULT_PLAN}">Voir un exemple</a>.</p>`
  }
}

render()