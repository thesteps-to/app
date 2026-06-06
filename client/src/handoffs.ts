import type { Handoff, HandoffStatus } from "@thesteps/common"

const KEY = "thesteps.handoffs"

export function loadHandoffs(): Handoff[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Handoff[]) : []
  } catch {
    return []
  }
}

export function saveHandoffs(handoffs: Handoff[]): void {
  localStorage.setItem(KEY, JSON.stringify(handoffs))
}

export function addHandoff(handoff: Handoff): Handoff[] {
  const all = [...loadHandoffs(), handoff]
  saveHandoffs(all)
  return all
}

export function updateHandoffStatus(id: string, status: HandoffStatus): Handoff[] {
  const all = loadHandoffs().map(h => h.id === id ? { ...h, status } : h)
  saveHandoffs(all)
  return all
}

export function handoffsForStep(planId: string, stepId: string): Handoff[] {
  return loadHandoffs().filter(h => h.planId === planId && h.stepId === stepId)
}

export function handoffsByProviderType(providerType: string): Handoff[] {
  return loadHandoffs().filter(h => h.providerType === providerType)
}

export function newHandoffId(): string {
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
