import { buildInbox, clearProProfile, listProviderCategories, loadProProfile, PRICE_TIER, saveProProfile } from "../pro.ts"
import type { InboxItem, ProviderProfile } from "../pro.ts"
import { loadBilling } from "../billing.ts"
import { navigate } from "../router.ts"
import { escapeAttr, escapeHtml } from "../escape.ts"

const LEVEL_LABEL = { contact: "Contact", project: "Projet", financial: "Financier" } as const

export async function renderPro(host: HTMLElement): Promise<void> {
  const profile = loadProProfile()
  if (!profile) return renderRegistration(host)
  return renderInbox(host, profile)
}

async function renderRegistration(host: HTMLElement): Promise<void> {
  const categories = await listProviderCategories()
  host.innerHTML = `
    <article class="pro-landing">
      <div class="page-eyebrow"><span class="eyebrow">Espace professionnels</span><span class="rule"></span></div>
      <h1 class="page-title">Recevez des dossiers qualifiés.<br>Payez au résultat.</h1>
      <p class="page-lead">
        Je vous transmets uniquement des dossiers que vos prospects ont eux-mêmes constitués
        et autorisés à partager. Vous payez quand l'affaire est conclue.
      </p>

      <div class="ts-card">
        <h2 class="ts-card__title">Tarif indicatif par dossier reçu</h2>
        <ul class="pricing-tiers">
          ${(["contact", "project", "financial"] as const).map(level => `
            <li>
              <span>${LEVEL_LABEL[level]}</span>
              <b>${PRICE_TIER[level]} €</b>
            </li>
          `).join("")}
        </ul>
        <p class="muted-link">
          Plus le dossier est complet, plus votre proposition peut être précise — et plus le lead vaut cher.
        </p>
      </div>

      <h2 class="section-title">Votre inscription</h2>
      <form class="pro-form">
        <div class="ts-field">
          <label class="ts-label" for="pro-cat">Catégorie</label>
          <select class="ts-select" id="pro-cat" name="category" required>
            <option value="">— Choisir une catégorie —</option>
            ${categories.map(category => `<option value="${escapeAttr(category.type)}">${escapeHtml(category.label)}</option>`).join("")}
          </select>
        </div>
        <div class="ts-field">
          <label class="ts-label" for="pro-email">E-mail</label>
          <input class="ts-input" id="pro-email" name="email" type="email" required placeholder="vous@exemple.fr">
        </div>
        <div class="ts-field">
          <label class="ts-label" for="pro-region">Région d'activité</label>
          <input class="ts-input" id="pro-region" name="region" type="text" required placeholder="Île-de-France, Auvergne-Rhône-Alpes…">
        </div>
        <div class="form-actions">
          <button class="ts-btn ts-btn--primary ts-btn--lg" type="submit">S'inscrire</button>
        </div>
      </form>
    </article>
  `
  host.querySelector<HTMLFormElement>("form.pro-form")?.addEventListener("submit", event => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const data = new FormData(form)
    const profile: ProviderProfile = {
      category: String(data.get("category") ?? ""),
      email: String(data.get("email") ?? ""),
      region: String(data.get("region") ?? ""),
    }
    if (!profile.category || !profile.email || !profile.region) return
    saveProProfile(profile)
    void renderInbox(host, profile)
  })
}

async function renderInbox(host: HTMLElement, profile: ProviderProfile): Promise<void> {
  host.innerHTML = `<p class="loading">Chargement des dossiers…</p>`
  const inbox = await buildInbox(profile.category)
  const billing = loadBilling()
  const dueTotal = billing.reduce((sum, entry) => sum + entry.amount, 0)
  host.innerHTML = `
    <section class="pro-inbox">
      <div class="page-eyebrow"><span class="eyebrow">Espace professionnels</span><span class="rule"></span></div>
      <p class="pro-header">
        Connecté comme <span class="ts-tag">${escapeHtml(profile.category)}</span>
        <span>·</span>
        <span>${escapeHtml(profile.region)}</span>
        <span>·</span>
        <a class="muted-link" href="#" data-logout>Se déconnecter</a>
      </p>

      <h1 class="page-title">Dossiers reçus <span class="ts-tag">${inbox.length}</span></h1>

      ${inbox.length === 0
        ? `<div class="ts-card ts-card--flat ts-empty">
             <span class="ts-glyph ts-glyph--lg" data-state="node"></span>
             <p class="ts-empty__title">Aucun dossier pour l'instant</p>
             <p class="ts-empty__body">Vos nouveaux dossiers apparaîtront ici.</p>
           </div>`
        : `<ul class="inbox">${inbox.map(renderInboxRow).join("")}</ul>`}

      ${renderBillingSection(billing, dueTotal)}
    </section>
  `
  host.querySelector<HTMLAnchorElement>("[data-logout]")?.addEventListener("click", event => {
    event.preventDefault()
    clearProProfile()
    navigate("/pro")
  })
}

function renderInboxRow(item: InboxItem): string {
  const statusBadge = item.status === "concluded"
    ? `<span class="ts-badge ts-badge--done">Conclu</span>`
    : `<span class="ts-badge ts-badge--current">Nouveau</span>`
  const demoTag = item.source === "demo" ? `<span class="ts-badge ts-badge--neutral">démo</span>` : ""
  return `
    <li>
      <a class="inbox-row" href="/pro/lead/${escapeAttr(item.id)}">
        <div class="row-head">
          <strong>${escapeHtml(item.planTitle)}</strong>
          ${demoTag}
          ${statusBadge}
        </div>
        <div class="row-body">${escapeHtml(item.stepTitle)}</div>
        <div class="row-meta">
          <span>${formatDate(item.date)}</span>
          <span>·</span>
          <span>${LEVEL_LABEL[item.level]}</span>
          <span>·</span>
          <span>${PRICE_TIER[item.level]} €</span>
        </div>
      </a>
    </li>
  `
}

function renderBillingSection(billing: ReturnType<typeof loadBilling>, dueTotal: number): string {
  if (billing.length === 0) {
    return `
      <section class="billing">
        <h2 class="section-title">Commissions</h2>
        <p class="muted-link">Aucune commission due pour l'instant.</p>
      </section>
    `
  }
  return `
    <section class="billing">
      <h2 class="section-title">Commissions <span class="ts-tag">${dueTotal} € dus</span></h2>
      <ul>
        ${billing.map(entry => `
          <li>
            <span>${escapeHtml(entry.planTitle)} — ${escapeHtml(entry.stepTitle)}</span>
            <span class="amount">${entry.amount} €</span>
          </li>
        `).join("")}
      </ul>
    </section>
  `
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}
