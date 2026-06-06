import type { DossierField, DossierSensitivity, Handoff, HandoffStatus, Plan } from "@thesteps/common"
import { planFields } from "@thesteps/common"
import { getCatalog } from "./catalog.ts"
import { loadDossier } from "./dossier.ts"
import { loadHandoffs } from "./handoffs.ts"

const PRO_KEY = "thesteps.pro"

export interface ProviderProfile {
  category: string
  email: string
  region: string
}

export function loadProProfile(): ProviderProfile | null {
  try {
    const raw = localStorage.getItem(PRO_KEY)
    return raw ? JSON.parse(raw) as ProviderProfile : null
  } catch {
    return null
  }
}

export function saveProProfile(profile: ProviderProfile): void {
  localStorage.setItem(PRO_KEY, JSON.stringify(profile))
}

export function clearProProfile(): void {
  localStorage.removeItem(PRO_KEY)
}

/** Indicative lead price per disclosure level — demonstrates the value alignment. */
export const PRICE_TIER: Record<DossierSensitivity, number> = {
  contact: 5,
  project: 25,
  financial: 80,
}

/** Distinct provider categories used across the catalog, alphabetically sorted. */
export async function listProviderCategories(): Promise<{ type: string; label: string }[]> {
  const catalog = await getCatalog()
  const seen = new Map<string, string>()
  for (const plan of catalog) {
    for (const step of plan.steps) {
      for (const provider of step.providers ?? []) {
        if (!seen.has(provider.type)) seen.set(provider.type, provider.label)
      }
    }
  }
  return [...seen].sort(([a], [b]) => a.localeCompare(b, "fr")).map(([type, label]) => ({ type, label }))
}

export interface InboxItem {
  source: "user" | "demo"
  id: string
  date: string
  level: DossierSensitivity
  status: HandoffStatus
  providerType: string
  planTitle: string
  stepTitle: string
  /** Field defs the user might share (the plan's full dossier schema). */
  allFields: DossierField[]
  /** field id → value for every value actually transmitted. */
  values: Record<string, unknown>
  /** Only for user-sourced leads: lets the provider mark the step done in the user's progress. */
  planId?: string
  stepId?: string
}

/** Lead inbox for the registered category: user's own handoffs + fabricated demos. */
export async function buildInbox(category: string): Promise<InboxItem[]> {
  const catalog = await getCatalog()
  const planById = new Map(catalog.map(plan => [plan.id, plan]))
  const dossier = loadDossier()

  const userItems = loadHandoffs()
    .filter(handoff => handoff.providerType === category)
    .map(handoff => userItem(handoff, planById, dossier.values))
    .filter((item): item is InboxItem => item !== null)

  const demoItems = demoLeadsFor(category, catalog)

  return [...userItems, ...demoItems].sort((a, b) => b.date.localeCompare(a.date))
}

export async function getInboxItem(id: string): Promise<InboxItem | undefined> {
  const profile = loadProProfile()
  if (!profile) return undefined
  const inbox = await buildInbox(profile.category)
  return inbox.find(item => item.id === id)
}

function userItem(
  handoff: Handoff,
  planById: Map<string, Plan>,
  dossierValues: Record<string, unknown>,
): InboxItem | null {
  const plan = planById.get(handoff.planId)
  if (!plan) return null
  const step = plan.steps.find(s => s.id === handoff.stepId)
  if (!step) return null
  const allFields = planFields(plan)
  const transmittedIds = new Set(handoff.fields)
  const values: Record<string, unknown> = {}
  for (const field of allFields) {
    if (transmittedIds.has(field.id)) values[field.id] = dossierValues[field.id]
  }
  return {
    source: "user",
    id: handoff.id,
    date: handoff.date,
    level: handoff.level,
    status: handoff.status,
    providerType: handoff.providerType,
    planTitle: plan.title,
    stepTitle: step.title,
    allFields,
    values,
    planId: handoff.planId,
    stepId: handoff.stepId,
  }
}

function demoLeadsFor(category: string, catalog: Plan[]): InboxItem[] {
  const buyahouse = catalog.find(plan => plan.id === "buyahouse")
  const allFieldsBH = buyahouse ? planFields(buyahouse) : []
  return DEMO_LEADS
    .filter(lead => lead.providerType === category)
    .map(lead => ({
      source: "demo",
      id: lead.id,
      date: lead.date,
      level: lead.level,
      status: lead.status,
      providerType: lead.providerType,
      planTitle: lead.planTitle,
      stepTitle: lead.stepTitle,
      allFields: allFieldsBH,
      values: lead.values,
    }))
}

interface DemoLead {
  id: string
  providerType: string
  planTitle: string
  stepTitle: string
  level: DossierSensitivity
  date: string
  status: HandoffStatus
  values: Record<string, unknown>
}

const DEMO_LEADS: DemoLead[] = [
  {
    id: "demo-courtier-1",
    providerType: "courtier",
    planTitle: "Acheter un logement",
    stepTitle: "Obtenir un accord de financement de principe",
    level: "project",
    date: "2026-06-04T08:30:00Z",
    status: "sent",
    values: { "achat-type": "Appartement ancien", "achat-zone": "Lyon 7e" },
  },
  {
    id: "demo-courtier-2",
    providerType: "courtier",
    planTitle: "Acheter un logement",
    stepTitle: "Finaliser votre prêt",
    level: "financial",
    date: "2026-06-02T14:10:00Z",
    status: "sent",
    values: {
      "achat-type": "Maison ancienne",
      "achat-zone": "Nantes (centre)",
      "achat-apport": 65000,
      "achat-budget": 320000,
    },
  },
  {
    id: "demo-notaire-1",
    providerType: "notaire",
    planTitle: "Acheter un logement",
    stepTitle: "Signer le compromis de vente",
    level: "financial",
    date: "2026-06-03T11:00:00Z",
    status: "sent",
    values: {
      "achat-type": "Appartement neuf",
      "achat-zone": "Bordeaux Bastide",
      "achat-budget": 410000,
    },
  },
  {
    id: "demo-agent-1",
    providerType: "agent",
    planTitle: "Acheter un logement",
    stepTitle: "Rechercher les biens",
    level: "project",
    date: "2026-06-01T09:00:00Z",
    status: "sent",
    values: { "achat-type": "Maison ancienne", "achat-zone": "Toulouse Sud" },
  },
]
