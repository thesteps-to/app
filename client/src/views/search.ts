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
      <form class="need-form need-form-inline" autocomplete="off">
        <label for="need" class="visually-hidden">Affiner la recherche</label>
        <input id="need" name="q" type="search" value="${escapeAttr(query)}"
               placeholder="Décrivez votre projet">
        <button type="submit">Rechercher</button>
      </form>
      <h1>${query ? `Plans pour « ${escapeHtml(query)} »` : "Tous les plans"}</h1>
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
    return `<p class="empty">Aucun plan ne correspond pour le moment. Essayez d'autres mots-clés.</p>`
  }
  const [top, ...rest] = results
  return `
    <ul class="plan-cards">
      <li><a class="plan-card recommended" href="/plan/${top!.id}">
        <p class="kicker">Recommandé</p>
        ${cardBody(top!)}
      </a></li>
      ${rest.map(plan => `<li><a class="plan-card" href="/plan/${plan.id}">${cardBody(plan)}</a></li>`).join("")}
    </ul>
  `
}

function cardBody(plan: Plan): string {
  const rating = plan.rating
    ? `<span class="rating" title="${plan.rating.count} avis">★ ${plan.rating.average.toFixed(1)}</span>`
    : ""
  const demo = plan.demo ? `<span class="demo-tag">démo</span>` : ""
  return `
    <h2>${escapeHtml(plan.title)} ${demo}</h2>
    <p class="author">par ${escapeHtml(plan.author.name)} ${rating}</p>
    <p class="summary">${escapeHtml(plan.summary)}</p>
  `
}

