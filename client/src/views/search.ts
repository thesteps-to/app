import type { Plan } from "@thesteps/common"
import { getCatalog } from "../catalog.ts"
import { rank } from "../search.ts"
import { navigate } from "../router.ts"
import { escapeAttr, escapeHtml } from "../escape.ts"

export async function renderSearch(host: HTMLElement, query: string): Promise<void> {
  host.innerHTML = `<p class="loading">Recherche en cours…</p>`
  const catalog = await getCatalog()
  const results = rank(catalog, query)
  host.innerHTML = `
    <section class="search">
      <div class="page-eyebrow"><span class="eyebrow">${query ? "Plans suggérés" : "Tous les plans"}</span><span class="rule"></span></div>
      <h1 class="page-title">${query ? `« ${escapeHtml(query)} »` : "Choisissez un plan"}</h1>

      <form class="need-form search-head" autocomplete="off">
        <div class="ts-field">
          <label class="ts-label" for="need">Affiner votre projet</label>
          <input class="ts-input" id="need" name="q" type="search" value="${escapeAttr(query)}"
                 placeholder="Décrivez votre projet">
        </div>
        <button class="ts-btn ts-btn--secondary" type="submit">Rechercher</button>
      </form>

      ${renderResults(results)}
    </section>
  `
  host.querySelector<HTMLFormElement>("form.need-form")?.addEventListener("submit", event => {
    event.preventDefault()
    const input = (event.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>("input[name=q]")
    const q = input?.value.trim() ?? ""
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
  })
}

function renderResults(results: Plan[]): string {
  if (results.length === 0) {
    return `
      <div class="ts-card ts-card--flat ts-empty">
        <span class="ts-glyph ts-glyph--lg" data-state="node"></span>
        <p class="ts-empty__title">Aucun plan ne correspond</p>
        <p class="ts-empty__body">Essayez d'autres mots-clés ou parcourez tous les plans.</p>
      </div>
    `
  }
  const [top, ...rest] = results
  return `
    <ul class="plan-cards">
      ${planCard(top!, true)}
      ${rest.map(plan => planCard(plan, false)).join("")}
    </ul>
  `
}

function planCard(plan: Plan, recommended: boolean): string {
  const ratingValue = plan.rating?.average.toFixed(1).replace(".", ",") ?? "—"
  const reviewsCount = plan.rating?.count ?? 0
  const demoTag = plan.demo
    ? `<span class="ts-badge ts-badge--neutral" title="Plan de démonstration">démo</span>`
    : ""
  const reco = recommended
    ? `<span class="ts-plan__reco">
         <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
         Recommandé
       </span>`
    : ""
  return `
    <li>
      <a class="ts-plan is-link" href="/plan/${escapeAttr(plan.id)}">
        <div class="ts-plan__cover ${plan.demo ? "ts-plan__cover--demo" : ""}">
          ${reco}
          <span class="cover-glyph" aria-hidden="true">
            <span class="ts-glyph" data-state="done"></span>
            <span class="ts-glyph" data-state="current"></span>
            <span class="ts-glyph" data-state="node"></span>
          </span>
        </div>
        <div class="ts-plan__body">
          <span class="ts-plan__cat">${escapeHtml(plan.needTags[0] ?? "Plan")}</span>
          <h2 class="ts-plan__title">${escapeHtml(plan.title)} ${demoTag}</h2>
          <p class="ts-plan__author">
            <span class="ts-avatar ts-avatar--sm ts-avatar--author">${escapeHtml(initials(plan.author.name))}</span>
            <b>${escapeHtml(plan.author.name)}</b>
          </p>
          <div class="ts-plan__stats">
            <span class="ts-rating">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
              ${ratingValue}
            </span>
            <span class="ts-plan__stat">${reviewsCount} avis</span>
            <span class="ts-plan__stat">${plan.steps.length} étapes</span>
          </div>
        </div>
        <div class="ts-plan__foot">
          <span class="ts-plan__free">Gratuit</span>
          <span class="ts-btn ts-btn--primary ts-btn--sm" aria-hidden="true">Voir le plan</span>
        </div>
      </a>
    </li>
  `
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("")
}
