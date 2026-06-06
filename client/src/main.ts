import { StepsPlan } from "./StepsPlan.ts"
import { startRouter } from "./router.ts"

customElements.define("steps-plan", StepsPlan)

const app = document.getElementById("app")
if (app) startRouter(app)
