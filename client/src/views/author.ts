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
      <p class="kicker">Espace auteurs</p>
      <h1>Publiez vos plans, soyez rémunérés sur les résultats</h1>
      <p class="lead">
        Vous êtes expert d'un parcours (achat immobilier, création d'entreprise, voyage…) ?
        Publiez votre plan : vous touchez une part de chaque commission versée par les
        professionnels que vous orientez vers les utilisateurs.
      </p>

      <section class="author-submit">
        <h2>Soumettre un plan</h2>
        <p class="secondary">Collez le JSON de votre plan ci-dessous. Il sera validé contre le modèle <code>createPlan</code> (étapes, DAG, auteur, needTags…). Aucune persistance serveur : seuls vos brouillons locaux sont enregistrés.</p>
        <textarea class="plan-json" rows="14" placeholder='{"id":"monplan","title":"…","lang":"fr",…}'></textarea>
        <div class="form-actions">
          <button type="button" data-validate>Valider le JSON</button>
        </div>
        <div class="submit-feedback" aria-live="polite"></div>
        ${drafts.length > 0 ? renderDrafts(drafts) : ""}
      </section>

      <section class="author-dashboard">
        <header class="dashboard-header">
          <h2>Tableau de bord</h2>
          <div class="demo-banner" role="note">
            <strong>Données de démonstration.</strong>
            Les compteurs d'usage et la rémunération cumulée sont fabriqués pour illustrer
            le tableau de bord ; les commissions issues de vos handoffs réels sont incluses.
          </div>
        </header>
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
  const textarea = host.querySelector<HTMLTextAreaElement>("textarea.plan-json")
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
        feedback.innerHTML = `<p class="success">✓ Brouillon enregistré localement.</p>`
        // Re-render to show the new draft in the list.
        setTimeout(() => void renderAuthor(host), 800)
      } catch (error) {
        feedback.innerHTML = `<p class="error">Erreur à l'enregistrement : ${escapeHtml(messageOf(error))}</p>`
      }
    })
  })
}

function renderFeedback(json: string): string {
  if (!json.trim()) return `<p class="error">Collez un JSON dans la zone ci-dessus.</p>`
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    return `<p class="error">JSON invalide : ${escapeHtml(messageOf(error))}</p>`
  }
  let plan: Plan
  try {
    plan = createPlan(parsed)
  } catch (error) {
    return `<p class="error">Modèle invalide : ${escapeHtml(messageOf(error))}</p>`
  }
  return `
    <p class="success">✓ Plan valide</p>
    ${renderPreview(plan)}
    <div class="form-actions">
      <button type="button" data-save class="primary">Enregistrer le brouillon</button>
    </div>
  `
}

function renderPreview(plan: Plan): string {
  const rating = plan.rating
    ? `<span class="rating">★ ${plan.rating.average.toFixed(1)}</span>`
    : ""
  return `
    <div class="plan-card recommended" aria-label="Aperçu du plan">
      <p class="kicker">Aperçu</p>
      <h3>${escapeHtml(plan.title)}</h3>
      <p class="author">par ${escapeHtml(plan.author.name)} ${rating}</p>
      <p class="summary">${escapeHtml(plan.summary)}</p>
      <p class="secondary">${plan.steps.length} étape(s) · ${plan.needTags.length} tag(s)</p>
    </div>
  `
}

function renderDrafts(drafts: Draft[]): string {
  return `
    <details class="drafts">
      <summary>Mes brouillons (${drafts.length})</summary>
      <ul>
        ${drafts.map(draft => `
          <li>
            <strong>${escapeHtml(draft.plan.title)}</strong>
            <span class="secondary">— ${formatDate(draft.date)}</span>
          </li>
        `).join("")}
      </ul>
    </details>
  `
}

function renderRemunerationSummary(actual: number, demoBaseline: number): string {
  return `
    <p class="remuneration-summary">
      Rémunération cumulée :
      <strong>${(actual + demoBaseline).toLocaleString("fr-FR")} €</strong>
      <span class="secondary">(${actual} € issus des commissions conclues en démo · ${demoBaseline.toLocaleString("fr-FR")} € baseline démo)</span>
    </p>
  `
}

function renderPlanRow(plan: Plan, earnings: number): string {
  const metrics = DEMO_METRICS[plan.id] ?? { started: 0, completed: 0 }
  const rating = plan.rating
    ? `<span class="rating">★ ${plan.rating.average.toFixed(1)} <span class="secondary">(${plan.rating.count})</span></span>`
    : `<span class="secondary">Pas encore noté</span>`
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
        <div><dt>Démarrés</dt><dd>${metrics.started.toLocaleString("fr-FR")}</dd></div>
        <div><dt>Finalisés</dt><dd>${metrics.completed.toLocaleString("fr-FR")}</dd></div>
        <div><dt>Taux</dt><dd>${conversion}</dd></div>
        <div><dt>Rémunération</dt><dd>${earnings.toLocaleString("fr-FR")} €</dd></div>
      </dl>
      ${reviews.length > 0 ? `
        <details>
          <summary>Avis (${reviews.length})</summary>
          <ul class="reviews-list">
            ${reviews.map(review => `
              <li>
                <p class="review-text">« ${escapeHtml(review.text)} »</p>
                <p class="review-meta secondary">${escapeHtml(review.author)} — ${escapeHtml(review.date)}</p>
              </li>
            `).join("")}
          </ul>
        </details>
      ` : ""}
    </li>
  `
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}
