import { emptyDossier } from "@thesteps/common"
import type { Dossier, DossierSensitivity } from "@thesteps/common"

const KEY = "thesteps.dossier"

/** Shared across plans: same field id = asked once. */
export function loadDossier(): Dossier {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyDossier()
    const parsed = JSON.parse(raw) as Partial<Dossier>
    const sharing = parsed.sharing
    return {
      values: parsed.values ?? {},
      sharing: sharing?.perProvider
        ? { defaultLevel: sharing.defaultLevel ?? "contact", perProvider: sharing.perProvider }
        : { defaultLevel: sharing?.defaultLevel ?? "contact" },
    }
  } catch {
    return emptyDossier()
  }
}

export function saveDossier(dossier: Dossier): void {
  localStorage.setItem(KEY, JSON.stringify(dossier))
}

export function setDossierValue(dossier: Dossier, fieldId: string, value: unknown): Dossier {
  const next: Dossier = { ...dossier, values: { ...dossier.values, [fieldId]: value } }
  saveDossier(next)
  return next
}

export function setDefaultSharingLevel(dossier: Dossier, level: DossierSensitivity): Dossier {
  const next: Dossier = { ...dossier, sharing: { ...dossier.sharing, defaultLevel: level } }
  saveDossier(next)
  return next
}

export function hasValue(dossier: Dossier, fieldId: string): boolean {
  const value = dossier.values[fieldId]
  return value !== undefined && value !== null && value !== ""
}
