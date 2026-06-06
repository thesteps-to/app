import type { Plan, Review } from "@thesteps/common"
import { getPlan } from "../catalog.ts"
import { renderNotFound } from "./notFound.ts"
import { escapeAttr, escapeHtml } from "../escape.ts"

export async function renderPresentation(host: HTMLElement, id: string): Promise<void> {
  host.innerHTML = `<p class="loading">Chargement du plan…</p>`
  const plan = await getPlan(id)
  if (!plan) return renderNotFound(host)
  document.title = `${plan.title} — thesteps.to`
  host.innerHTML = `
    <article class="presentation">
      <p><a class="muted-link" href="/search">← Tous les plans</a></p>
      ${plan.demo ? demoBanner() : ""}

      <div class="page-eyebrow">
        <span class="ts-glyph ts-glyph--sm" data-state="current"></span>
        <span class="eyebrow">${escapeHtml(plan.needTags[0] ?? "Plan")}</span>
      </div>
      <h1 class="page-title">${escapeHtml(plan.title)}</h1>
      <p class="page-lead">${escapeHtml(plan.summary)}</p>

      <div class="meta-row">
        ${plan.rating ? `
          <span class="ts-rating">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
            ${plan.rating.average.toFixed(1).replace(".", ",")}
            <span>(${plan.rating.count} avis)</span>
          </span>` : ""}
        <span class="ts-tag">${plan.steps.length} étapes</span>
        <span class="ts-plan__free">Gratuit</span>
      </div>

      ${renderVideo(plan)}

      <section class="author-card">
        <span class="ts-avatar ts-avatar--lg ts-avatar--author">${escapeHtml(initials(plan.author.name))}</span>
        <div>
          <p class="eyebrow">L'auteur</p>
          <h2>${escapeHtml(plan.author.name)}</h2>
          ${plan.author.bio ? `<p class="bio">${escapeHtml(plan.author.bio)}</p>` : ""}
        </div>
      </section>

      <h2 class="section-title">Ce que je fais pour vous</h2>
      <ol class="step-summary">
        ${plan.steps.map((step, index) => `
          <li>
            <span class="ts-glyph ts-glyph--sm" data-state="${index === 0 ? "current" : "node"}"></span>
            <span class="label">${escapeHtml(step.title)}</span>
          </li>`).join("")}
      </ol>

      ${renderReviews(plan.reviews)}

      <div class="cta-block">
        <a class="ts-btn ts-btn--primary ts-btn--lg ts-btn--block" href="/plan/${escapeAttr(plan.id)}/run">
          Commencer ce plan
        </a>
        <p class="muted-link" style="text-align:center">Vous restez maître de vos données à chaque étape.</p>
      </div>
    </article>
  `
}

function renderVideo(plan: Plan): string {
  if (!plan.author.videoUrl) {
    return `<div class="video-placeholder">Vidéo de présentation à venir</div>`
  }
  return `
    <div class="video-link">
      <a class="ts-btn ts-btn--ghost" href="${escapeAttr(plan.author.videoUrl)}" target="_blank" rel="noopener">
        Voir la vidéo de présentation
      </a>
    </div>
  `
}

function renderReviews(reviews: Review[] | undefined): string {
  if (!reviews?.length) return ""
  return `
    <section class="reviews-block">
      <h2 class="section-title">Avis des utilisateurs</h2>
      ${reviews.map(review => `
        <div class="review-card">
          <p class="text">« ${escapeHtml(review.text)} »</p>
          <p class="meta">${escapeHtml(review.author)} — ${escapeHtml(review.date)}</p>
        </div>
      `).join("")}
    </section>
  `
}

function demoBanner(): string {
  return `
    <div class="ts-banner ts-banner--demo" role="note">
      <span class="ts-banner__dot"></span>
      <div class="ts-banner__body">
        <b>Données de démonstration.</b>
        <p>Ce plan illustre le service ; il n'est pas encore opérationnel.</p>
      </div>
    </div>
  `
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("")
}
