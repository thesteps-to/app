import type { Plan } from "@thesteps/common"
import { getCatalog } from "../catalog.ts"
import { navigate } from "../router.ts"
import { escapeAttr, escapeHtml } from "../escape.ts"

const CATEGORIES: ReadonlyArray<{ tag: string; icon: string; label: string }> = [
  { tag: "immobilier", icon: "🏠", label: "Immobilier" },
  { tag: "entreprise", icon: "🚀", label: "Entreprise" },
  { tag: "voyage", icon: "✈️", label: "Voyage" },
  { tag: "mariage", icon: "💍", label: "Mariage" },
  { tag: "naissance", icon: "👶", label: "Naissance" },
  { tag: "études", icon: "📚", label: "Études" },
]

const COVER_TONES = ["a", "b", "c"] as const

const STAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`

export async function renderLanding(host: HTMLElement): Promise<void> {
  host.className = "landing-page"
  host.innerHTML = `<p class="loading">Chargement…</p>`
  const catalog = await getCatalog()
  const recommended = [...catalog].sort(byRating)

  host.innerHTML = `
    <section class="ts-hero">
      <p class="ts-hero__eyebrow">Gratuit · guidé par des experts</p>
      <h1>Quel est votre grand projet ?</h1>
      <p class="ts-hero__sub">Dites-moi ce que vous voulez accomplir. Je prépare le plan, je remplis votre dossier au fur et à mesure, et je vous mets en relation avec les bons professionnels — au bon moment.</p>
      <form class="searchbar" autocomplete="off">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input class="searchbar__input" name="q" type="search" required
               placeholder="Acheter un logement, créer une entreprise, partir en vacances…"
               aria-label="Votre projet">
        <button class="ts-btn ts-btn--primary" type="submit">Trouver un plan</button>
      </form>
      <div class="chips">
        ${CATEGORIES.map(c => `<button type="button" class="ts-tag" data-tag="${escapeAttr(c.tag)}">${c.icon} ${escapeHtml(c.label)}</button>`).join("")}
      </div>
    </section>

    <section class="listing">
      <div class="listing__head">
        <h2>Recommandés pour vous</h2>
        <span class="listing__meta">Classés par note</span>
      </div>
      <ul class="plan-grid">${recommended.map((plan, i) => planCard(plan, i === 0)).join("")}</ul>
    </section>
  `

  host.querySelector<HTMLFormElement>("form.searchbar")?.addEventListener("submit", event => {
    event.preventDefault()
    const input = (event.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>("input[name=q]")
    const q = input?.value.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  })

  host.querySelectorAll<HTMLButtonElement>(".chips .ts-tag").forEach(chip => {
    chip.addEventListener("click", () => {
      const tag = chip.dataset.tag ?? ""
      if (tag) navigate(`/search?q=${encodeURIComponent(tag)}`)
    })
  })
}

function byRating(a: Plan, b: Plan): number {
  return (b.rating?.average ?? 0) - (a.rating?.average ?? 0)
}

function planCard(plan: Plan, recommended: boolean): string {
  const tone = COVER_TONES[hashCode(plan.id) % COVER_TONES.length]!
  const ratingValue = plan.rating?.average.toFixed(1).replace(".", ",") ?? "—"
  const reviewsCount = plan.rating?.count ?? 0
  const demoTag = plan.demo
    ? `<span class="ts-badge ts-badge--neutral" title="Plan de démonstration">démo</span>`
    : ""
  const reco = recommended
    ? `<span class="ts-plan__reco">${STAR_SVG} Recommandé</span>`
    : ""
  return `
    <li>
      <a class="ts-plan is-link" href="/plan/${escapeAttr(plan.id)}">
        <div class="ts-plan__cover cover-${tone}">
          ${reco}
          <span class="cover-glyph" aria-hidden="true">
            <span class="ts-glyph" data-state="done"></span>
            <span class="ts-glyph" data-state="current"></span>
            <span class="ts-glyph" data-state="node"></span>
          </span>
        </div>
        <div class="ts-plan__body">
          <span class="ts-plan__cat">${escapeHtml(plan.needTags[0] ?? "Plan")}</span>
          <h3 class="ts-plan__title">${escapeHtml(plan.title)} ${demoTag}</h3>
          <p class="ts-plan__author">
            <span class="ts-avatar ts-avatar--sm ts-avatar--author">${escapeHtml(initials(plan.author.name))}</span>
            <b>${escapeHtml(plan.author.name)}</b>
          </p>
          <div class="ts-plan__stats">
            <span class="ts-rating">${STAR_SVG}${ratingValue}</span>
            <span class="ts-plan__stat">${reviewsCount} avis</span>
            <span class="ts-plan__stat">${plan.steps.length} étapes</span>
          </div>
        </div>
        <div class="ts-plan__foot">
          <span class="ts-plan__free">Gratuit</span>
          <span class="ts-btn ts-btn--${recommended ? "primary" : "secondary"} ts-btn--sm" aria-hidden="true">${recommended ? "Commencer" : "Aperçu"}</span>
        </div>
      </a>
    </li>
  `
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("")
}

function hashCode(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}