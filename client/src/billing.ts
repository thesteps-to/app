import type { DossierSensitivity } from "@thesteps/common"

const BILLING_KEY = "thesteps.billing"

export interface BillingEntry {
  /** Handoff id this entry is billing for (one entry per concluded handoff). */
  id: string
  date: string
  planTitle: string
  stepTitle: string
  providerType: string
  level: DossierSensitivity
  amount: number
  status: "due"
}

export function loadBilling(): BillingEntry[] {
  try {
    const raw = localStorage.getItem(BILLING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BillingEntry[]) : []
  } catch {
    return []
  }
}

export function saveBilling(entries: BillingEntry[]): void {
  localStorage.setItem(BILLING_KEY, JSON.stringify(entries))
}

export function addBilling(entry: BillingEntry): BillingEntry[] {
  const entries = loadBilling()
  if (entries.some(existing => existing.id === entry.id)) return entries
  const next = [...entries, entry]
  saveBilling(next)
  return next
}
