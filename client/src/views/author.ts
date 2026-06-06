import { createPlan } from "@thesteps/common"
import type { Plan } from "@thesteps/common"
import { getCatalog } from "../catalog.ts"
import { authorRemuneration, DEMO_METRICS, loadDrafts, saveDraft } from "../author.ts"
import type { Draft } from "../author.ts"
import { escapeHtml } from "../escape.ts"

export async function renderAuthor(host: HTMLElement): Promise<void> {
  host.innerHTML = `<p class="loading">Chargement…</p>`
  const catalog = await getCatalog()
  const remuneration = authorRemuneration(catalog)
  const drafts = loadDrafts()
  host.innerHTML = `
    <article class="author-page">
      <div class="page-eyebrow"><span class="eyebrow">Espace auteurs</span><span class="rule"></span></div>
      <h1 class="page-title">Publiez vos plans.<br>Soyez rémunéré sur les résultats.</h1>
      <p class="page-lead">
        Vous êtes expert·e d'un parcours (achat, création d'entreprise, voyage…) ? Publiez votre
        plan : vous touchez une part de chaque commission versée par les professionnels que les
        utilisateurs choisissent à vos étapes.
      </p>

      <section class="ts-card">
        <h2 class="ts-card__title">Soumettre un plan</h2>
        <p class="muted-link">
          Collez le JSON de votre plan. Je le valide contre le modèle (étapes, DAG, auteur, tags…)
          et vous montre un aperçu. Vos brouillons restent en local.
        </p>
        <div class="ts-field" style="margin-top: var(--space-md)">
          <label class="ts-label" for="plan-json">JSON du plan</label>
          <textarea class="ts-textarea plan-json" id="plan-json"
                    placeholder='{"id":"monplan","title":"…","lang":"fr",…}'></textarea>
        </div>
        <div class="form-actions">
          <button class="ts-btn ts-btn--secondary" type="button" data-validate>Valider le JSON</button>
        </div>
        <div class="submit-feedback" aria-live="polite"></div>
        ${drafts.length > 0 ? renderDrafts(drafts) : ""}
      </section>

      <section class="ts-card" style="margin-top: var(--space-xl)">
        <h2 class="ts-card__title">Tableau de bord</h2>
        <div class="ts-banner ts-banner--demo" role="note" style="margin-top: var(--space-sm)">
          <span class="ts-banner__dot"></span>
          <div class="ts-banner__body">
            <b>Données de démonstration.</b>
            <p>Les compteurs d'usage et la rémunération cumulée sont fabriqués pour illustrer le tableau de bord ; les commissions issues de vos handoffs réels sont incluses.</p>
          </div>
        </div>
        ${renderRemunerationSummary(remuneration.total, remuneration.demoBaseline)}
        <ul class="author-plans">
          ${catalog.map(plan => renderPlanRow(plan, remuneration.perPlan.get(plan.id) ?? 0)).join("")}
        </ul>
      </section>
    </article>
  `
  wireSubmit(host)
}

function wireSubmit(host: HTMLElement): void {
  const textarea = host.querySelector<HTMLTextAreaElement>(".plan-json")
  const feedback = host.querySelector<HTMLDivElement>(".submit-feedback")
  if (!textarea || !feedback) return
  host.querySelector<HTMLButtonElement>("[data-validate]")?.addEventListener("click", () => {
    feedback.innerHTML = renderFeedback(textarea.value)
    const save = feedback.querySelector<HTMLButtonElement>("[data-save]")
    save?.addEventListener("click", () => {
      try {
        const plan = createPlan(JSON.parse(textarea.value))
        saveDraft(plan)
        textarea.value = ""
        feedback.innerHTML = `<div class="ts-banner ts-banner--success"><div class="ts-banner__body">Brouillon enregistré localement.</div></div>`
        setTimeout(() => void renderAuthor(host), 800)
      } catch (error) {
        feedback.innerHTML = errorBanner(messageOf(error))
      }
    })
  })
}

function renderFeedback(json: string): string {
  if (!json.trim()) return errorBanner("Collez un JSON dans la zone ci-dessus.")
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    return errorBanner(`JSON invalide : ${messageOf(error)}`)
  }
  let plan: Plan
  try {
    plan = createPlan(parsed)
  } catch (error) {
    return errorBanner(`Modèle invalide : ${messageOf(error)}`)
  }
  return `
    <div class="ts-banner ts-banner--success">
      <div class="ts-banner__body"><b>Plan valide.</b><p>Aperçu ci-dessous.</p></div>
    </div>
    ${renderPreview(plan)}
    <div class="form-actions" style="margin-top: var(--space-md)">
      <button class="ts-btn ts-btn--primary" type="button" data-save>Enregistrer le brouillon</button>
    </div>
  `
}

function errorBanner(message: string): string {
  return `
    <div class="ts-banner ts-banner--error">
      <div class="ts-banner__body">${escapeHtml(message)}</div>
    </div>`
}

function renderPreview(plan: Plan): string {
  const rating = plan.rating
    ? `<span class="ts-rating">
         <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
         ${plan.rating.average.toFixed(1).replace(".", ",")}
       </span>`
    : ""
  return `
    <article class="ts-plan" style="margin-top: var(--space-md)">
      <div class="ts-plan__body">
        <span class="ts-plan__cat">Aperçu</span>
        <h3 class="ts-plan__title">${escapeHtml(plan.title)}</h3>
        <p class="ts-plan__author">
          <span class="ts-avatar ts-avatar--sm ts-avatar--author">${escapeHtml(initials(plan.author.name))}</span>
          <b>${escapeHtml(plan.author.name)}</b>
        </p>
        <div class="ts-plan__stats">
          ${rating}
          <span class="ts-plan__stat">${plan.steps.length} étapes</span>
          <span class="ts-plan__stat">${plan.needTags.length} tags</span>
        </div>
      </div>
    </article>
  `
}

function renderDrafts(drafts: Draft[]): string {
  return `
    <details style="margin-top: var(--space-md)">
      <summary>Mes brouillons (${drafts.length})</summary>
      <ul style="list-style:none; padding:0; margin: var(--space-sm) 0">
        ${drafts.map(draft => `
          <li style="padding: var(--space-xs) 0">
            <strong>${escapeHtml(draft.plan.title)}</strong>
            <span class="muted-link">— ${formatDate(draft.date)}</span>
          </li>
        `).join("")}
      </ul>
    </details>
  `
}

function renderRemunerationSummary(actual: number, demoBaseline: number): string {
  return `
    <div class="remuneration-summary">
      Rémunération cumulée :
      <b>${(actual + demoBaseline).toLocaleString("fr-FR")} €</b>
      <p class="muted-link">
        Dont ${actual} € de commissions conclues en démo et
        ${demoBaseline.toLocaleString("fr-FR")} € de baseline démo.
      </p>
    </div>
  `
}

function renderPlanRow(plan: Plan, earnings: number): string {
  const metrics = DEMO_METRICS[plan.id] ?? { started: 0, completed: 0 }
  const rating = plan.rating
    ? `<span class="ts-rating">
         <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
         ${plan.rating.average.toFixed(1).replace(".", ",")}
         <span>(${plan.rating.count})</span>
       </span>`
    : `<span class="muted-link">Pas encore noté</span>`
  const conversion = metrics.started > 0
    ? `${Math.round((metrics.completed / metrics.started) * 100)} %`
    : "—"
  const reviews = plan.reviews ?? []
  return `
    <li class="author-plan">
      <header>
        <h3>${escapeHtml(plan.title)}</h3>
        ${rating}
      </header>
      <dl class="metrics">
        <div class="metric"><dt>Démarrés</dt><dd>${metrics.started.toLocaleString("fr-FR")}</dd></div>
        <div class="metric"><dt>Finalisés</dt><dd>${metrics.completed.toLocaleString("fr-FR")}</dd></div>
        <div class="metric"><dt>Taux</dt><dd>${conversion}</dd></div>
        <div class="metric"><dt>Rémunération</dt><dd>${earnings.toLocaleString("fr-FR")} €</dd></div>
      </dl>
      ${reviews.length > 0 ? `
        <details>
          <summary>Avis (${reviews.length})</summary>
          <div style="margin-top: var(--space-sm); display:flex; flex-direction:column; gap: var(--space-sm)">
            ${reviews.map(review => `
              <div class="review-card">
                <p class="text">« ${escapeHtml(review.text)} »</p>
                <p class="meta">${escapeHtml(review.author)} — ${escapeHtml(review.date)}</p>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
    </li>
  `
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("")
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}
