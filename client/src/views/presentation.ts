import type { Plan, Review } from "@thesteps/common"
import { getPlan } from "../catalog.ts"
import { renderNotFound } from "./notFound.ts"

export async function renderPresentation(host: HTMLElement, id: string): Promise<void> {
  host.innerHTML = `<p class="loading">Chargement du plan…</p>`
  const plan = await getPlan(id)
  if (!plan) return renderNotFound(host)
  document.title = `${plan.title} — thesteps.to`
  host.innerHTML = `
    <article class="presentation">
      <p class="secondary"><a href="/search">← Voir d'autres plans</a></p>
      ${plan.demo ? demoBanner() : ""}
      <h1>${escapeHtml(plan.title)}</h1>
      <p class="lead">${escapeHtml(plan.summary)}</p>
      ${renderVideo(plan)}
      ${renderAuthor(plan)}
      <section class="what">
        <h2>Ce que ce plan fait pour vous</h2>
        <ol class="step-summary">
          ${plan.steps.map(step => `<li><strong>${escapeHtml(step.title)}</strong></li>`).join("")}
        </ol>
      </section>
      ${renderReviews(plan.reviews)}
      <p class="cta">
        <a class="primary" href="/plan/${plan.id}/run">Commencer ce plan</a>
      </p>
    </article>
  `
}

function renderVideo(plan: Plan): string {
  if (!plan.author.videoUrl) {
    return `
      <div class="video-placeholder" aria-label="Vidéo de présentation à venir">
        <span>▶ Vidéo de présentation à venir</span>
      </div>
    `
  }
  return `
    <div class="video">
      <a href="${escapeAttr(plan.author.videoUrl)}" target="_blank" rel="noopener">
        ▶ Voir la vidéo de présentation
      </a>
    </div>
  `
}

function renderAuthor(plan: Plan): string {
  const { author, rating } = plan
  const ratingMarkup = rating
    ? `<p class="rating">★ ${rating.average.toFixed(1)} <span class="count">(${rating.count} avis)</span></p>`
    : ""
  return `
    <section class="author">
      <h2>L'auteur</h2>
      <p class="author-name">${escapeHtml(author.name)}</p>
      ${author.bio ? `<p class="author-bio">${escapeHtml(author.bio)}</p>` : ""}
      ${ratingMarkup}
    </section>
  `
}

function renderReviews(reviews: Review[] | undefined): string {
  if (!reviews?.length) return ""
  return `
    <section class="reviews">
      <h2>Avis des utilisateurs</h2>
      <ul>
        ${reviews.map(review => `
          <li>
            <p class="review-text">« ${escapeHtml(review.text)} »</p>
            <p class="review-meta">${escapeHtml(review.author)} — ${escapeHtml(review.date)}</p>
          </li>
        `).join("")}
      </ul>
    </section>
  `
}

function demoBanner(): string {
  return `
    <div class="demo-banner" role="note">
      <strong>Données de démonstration.</strong>
      Ce plan illustre le fonctionnement du service ; il n'est pas encore opérationnel.
    </div>
  `
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]!))
}

function escapeAttr(value: string): string {
  return escapeHtml(value)
}
