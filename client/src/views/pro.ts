import { buildInbox, clearProProfile, listProviderCategories, loadProProfile, PRICE_TIER, saveProProfile } from "../pro.ts"
import type { InboxItem, ProviderProfile } from "../pro.ts"
import { loadBilling } from "../billing.ts"
import { navigate } from "../router.ts"
import { escapeAttr, escapeHtml } from "../escape.ts"

export async function renderPro(host: HTMLElement): Promise<void> {
  const profile = loadProProfile()
  if (!profile) return renderRegistration(host)
  return renderInbox(host, profile)
}

async function renderRegistration(host: HTMLElement): Promise<void> {
  const categories = await listProviderCategories()
  host.innerHTML = `
    <article class="pro-landing">
      <p class="kicker">Espace professionnels</p>
      <h1>Recevez des dossiers qualifiés, payez au résultat</h1>
      <p class="lead">
        thesteps.to vous transmet des prospects préparés, avec un dossier construit étape par
        étape par l'utilisateur. Vous ne payez que pour les dossiers réellement conclus.
      </p>
      <section class="pricing">
        <h2>Tarif indicatif par dossier reçu</h2>
        <ul class="tiers">
          ${(["contact", "project", "financial"] as const).map(level => `
            <li><strong>${LEVEL_LABEL[level]}</strong> — ${PRICE_TIER[level]} €</li>
          `).join("")}
        </ul>
        <p class="secondary">Le tarif augmente avec le niveau de divulgation choisi par l'utilisateur — plus le dossier est complet, plus votre proposition peut être précise.</p>
      </section>
      <form class="need-form pro-form">
        <label>
          Catégorie
          <select name="category" required>
            <option value="">— Choisissez —</option>
            ${categories.map(category => `<option value="${escapeAttr(category.type)}">${escapeHtml(category.label)}</option>`).join("")}
          </select>
        </label>
        <label>
          Email
          <input name="email" type="email" required placeholder="vous@exemple.fr">
        </label>
        <label>
          Région
          <input name="region" type="text" required placeholder="Île-de-France, Auvergne-Rhône-Alpes…">
        </label>
        <button type="submit" class="primary">S'inscrire</button>
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
      <p class="kicker">Espace professionnels</p>
      <header class="pro-header">
        <p>
          Connecté en tant que <strong>${escapeHtml(profile.category)}</strong> ·
          ${escapeHtml(profile.region)} ·
          <a href="#" data-logout>Se déconnecter</a>
        </p>
      </header>
      <h1>Dossiers reçus (${inbox.length})</h1>
      ${inbox.length === 0
        ? `<p class="empty">Aucun dossier pour le moment.</p>`
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
  const statusTag = item.status === "concluded"
    ? `<span class="sent-tag">✓ Concluée</span>`
    : `<span class="kicker">Nouveau</span>`
  const demoTag = item.source === "demo" ? `<span class="demo-tag">démo</span>` : ""
  return `
    <li>
      <a class="inbox-row" href="/pro/lead/${escapeAttr(item.id)}">
        <div class="row-head">
          <strong>${escapeHtml(item.planTitle)}</strong>
          ${demoTag}
          ${statusTag}
        </div>
        <div class="row-body">
          <span>${escapeHtml(item.stepTitle)}</span>
        </div>
        <div class="row-meta">
          <span>${formatDate(item.date)}</span>
          <span>· ${LEVEL_LABEL[item.level]}</span>
          <span>· ${PRICE_TIER[item.level]} €</span>
        </div>
      </a>
    </li>
  `
}

function renderBillingSection(billing: ReturnType<typeof loadBilling>, dueTotal: number): string {
  if (billing.length === 0) {
    return `
      <section class="billing">
        <h2>Commissions</h2>
        <p class="empty">Aucune commission due pour le moment.</p>
      </section>
    `
  }
  return `
    <section class="billing">
      <h2>Commissions (${dueTotal} € dus)</h2>
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

const LEVEL_LABEL = {
  contact: "Contact",
  project: "Projet",
  financial: "Financier",
} as const

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}
