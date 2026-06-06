import type { DossierField } from "@thesteps/common"
import { isFieldShareable } from "@thesteps/common"
import { getInboxItem, loadProProfile, PRICE_TIER } from "../pro.ts"
import type { InboxItem } from "../pro.ts"
import { addBilling } from "../billing.ts"
import { updateHandoffStatus } from "../handoffs.ts"
import { markStepDone } from "../progress.ts"
import { navigate } from "../router.ts"
import { renderNotFound } from "./notFound.ts"
import { escapeHtml } from "../escape.ts"

export async function renderProLead(host: HTMLElement, id: string): Promise<void> {
  if (!loadProProfile()) {
    navigate("/pro")
    return
  }
  host.innerHTML = `<p class="loading">Chargement du dossier…</p>`
  const item = await getInboxItem(id)
  if (!item) return renderNotFound(host)
  renderItem(host, item)
}

function renderItem(host: HTMLElement, item: InboxItem): void {
  const sharedFieldDefs = item.allFields.filter(f => isFieldShareable(item.level, f.sensitivity))
  const transmittedIds = new Set(Object.keys(item.values))
  const shared = sharedFieldDefs.filter(f => transmittedIds.has(f.id))
  const lockedFields = item.allFields.filter(f => !isFieldShareable(item.level, f.sensitivity))
  const isConcluded = item.status === "concluded"
  host.innerHTML = `
    <article class="pro-lead">
      <p class="secondary"><a href="/pro">← Tous les dossiers</a></p>
      <p class="kicker">Dossier reçu</p>
      <h1>${escapeHtml(item.planTitle)} ${item.source === "demo" ? `<span class="demo-tag">démo</span>` : ""}</h1>
      <p class="purpose">Étape : <strong>${escapeHtml(item.stepTitle)}</strong></p>
      <p class="meta">
        Niveau de divulgation : <strong>${LEVEL_LABEL[item.level]}</strong> ·
        Tarif : <strong>${PRICE_TIER[item.level]} €</strong> ·
        Reçu le ${formatDate(item.date)}
      </p>
      ${item.source === "demo" ? demoBanner() : ""}
      <section class="transmitted">
        <h2>Données transmises (${shared.length})</h2>
        ${shared.length === 0
          ? `<p class="empty">Aucune donnée du dossier transmise (niveau le plus bas).</p>`
          : `<ul class="shared-fields">${shared.map(field => renderField(field, item.values[field.id], false)).join("")}</ul>`}
      </section>
      ${lockedFields.length > 0 ? `
        <section class="locked">
          <h2>Données non partagées à ce niveau</h2>
          <ul class="shared-fields">${lockedFields.map(field => renderField(field, undefined, true)).join("")}</ul>
        </section>
      ` : ""}
      <div class="pro-actions">
        ${isConcluded
          ? `<p class="sent-tag">✓ Affaire conclue</p>`
          : `<button type="button" class="primary" data-conclude>Affaire conclue</button>`}
      </div>
    </article>
  `
  host.querySelector<HTMLButtonElement>("[data-conclude]")?.addEventListener("click", () => {
    conclude(host, item)
  })
}

function conclude(host: HTMLElement, item: InboxItem): void {
  if (item.source === "user") {
    updateHandoffStatus(item.id, "concluded")
    if (item.planId && item.stepId) markStepDone(item.planId, item.stepId)
  }
  addBilling({
    id: item.id,
    date: new Date().toISOString(),
    planTitle: item.planTitle,
    stepTitle: item.stepTitle,
    providerType: item.providerType,
    level: item.level,
    amount: PRICE_TIER[item.level],
    status: "due",
  })
  renderItem(host, { ...item, status: "concluded" })
}

function renderField(field: DossierField, value: unknown, locked: boolean): string {
  if (locked) {
    return `
      <li class="locked">
        <span class="field-label">${escapeHtml(field.label)}</span>
        <span class="field-value">🔒 Non partagé à ce niveau de divulgation</span>
      </li>`
  }
  return `
    <li>
      <span class="field-label">${escapeHtml(field.label)}</span>
      <span class="field-value">${escapeHtml(formatValue(value))}</span>
    </li>`
}

function demoBanner(): string {
  return `
    <div class="demo-banner" role="note">
      <strong>Données de démonstration.</strong>
      Ce dossier est fabriqué pour illustrer le fonctionnement de l'inbox.
    </div>
  `
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "number") return value.toLocaleString("fr-FR")
  return String(value)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

const LEVEL_LABEL = {
  contact: "Contact",
  project: "Projet",
  financial: "Financier",
} as const
