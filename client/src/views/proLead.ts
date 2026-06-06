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

const LEVEL_LABEL = { contact: "Contact", project: "Projet", financial: "Financier" } as const

const SHARED_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`
const PROTECTED_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

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
  const transmittedIds = new Set(Object.keys(item.values))
  const allShareable = item.allFields.filter(f => isFieldShareable(item.level, f.sensitivity))
  const shared = allShareable.filter(f => transmittedIds.has(f.id))
  const lockedFields = item.allFields.filter(f => !isFieldShareable(item.level, f.sensitivity))
  const isConcluded = item.status === "concluded"
  host.innerHTML = `
    <article class="pro-lead">
      <p><a class="muted-link" href="/pro">← Tous les dossiers</a></p>
      <div class="page-eyebrow"><span class="eyebrow">Dossier reçu</span><span class="rule"></span></div>
      <h1 class="page-title">${escapeHtml(item.planTitle)} ${item.source === "demo" ? `<span class="ts-badge ts-badge--neutral">démo</span>` : ""}</h1>
      <p class="page-lead">Étape : <strong>${escapeHtml(item.stepTitle)}</strong></p>

      <div class="meta-row">
        <span class="ts-tag">Niveau : ${LEVEL_LABEL[item.level]}</span>
        <span class="ts-tag">Tarif : ${PRICE_TIER[item.level]} €</span>
        <span class="ts-tag">Reçu le ${formatDate(item.date)}</span>
      </div>

      ${item.source === "demo" ? demoBanner() : ""}

      <h2 class="section-title">Données transmises (${shared.length})</h2>
      <div class="shared-block">
        ${shared.length === 0
          ? `<p class="muted-link">Aucune donnée du dossier transmise.</p>`
          : shared.map(field => sharedRow(field, item.values[field.id])).join("")}
      </div>

      ${lockedFields.length > 0 ? `
        <h2 class="section-title">Données protégées à ce niveau</h2>
        <div class="shared-block">
          ${lockedFields.map(field => protectedRow(field)).join("")}
        </div>` : ""}

      <div class="pro-actions">
        ${isConcluded
          ? `<span class="ts-badge ts-badge--done">Affaire conclue</span>`
          : `<button class="ts-btn ts-btn--primary" type="button" data-conclude>Affaire conclue</button>`}
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

function sharedRow(field: DossierField, value: unknown): string {
  return `
    <div class="ts-shared" data-shared="true">
      <span class="ts-shared__icon">${SHARED_ICON}</span>
      <span class="ts-shared__body">
        <span class="ts-shared__label">${LEVEL_LABEL[field.sensitivity]} · ${escapeHtml(field.label)}</span>
        <span class="ts-shared__value">${escapeHtml(formatValue(value))}</span>
      </span>
      <span class="ts-shared__state">Partagé</span>
    </div>`
}

function protectedRow(field: DossierField): string {
  return `
    <div class="ts-shared" data-shared="false">
      <span class="ts-shared__icon">${PROTECTED_ICON}</span>
      <span class="ts-shared__body">
        <span class="ts-shared__label">${LEVEL_LABEL[field.sensitivity]} · ${escapeHtml(field.label)}</span>
        <span class="ts-shared__value">Non partagé à ce niveau de divulgation</span>
      </span>
      <span class="ts-shared__state">Protégé</span>
    </div>`
}

function demoBanner(): string {
  return `
    <div class="ts-banner ts-banner--demo" role="note">
      <span class="ts-banner__dot"></span>
      <div class="ts-banner__body">
        <b>Données de démonstration.</b>
        <p>Ce dossier est fabriqué pour illustrer le fonctionnement de l'inbox.</p>
      </div>
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
