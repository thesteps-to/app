import type { Progress } from "@thesteps/common"

export function progressKey(planId: string): string {
  return `thesteps.progress.${planId}`
}

export function loadProgress(planId: string): Progress {
  try {
    const raw = localStorage.getItem(progressKey(planId))
    if (raw) return JSON.parse(raw) as Progress
  } catch {
    // Corrupted progress: start over.
  }
  return { doneSteps: [], checked: {} }
}

export function saveProgress(planId: string, progress: Progress): void {
  localStorage.setItem(progressKey(planId), JSON.stringify(progress))
}

export function markStepDone(planId: string, stepId: string): Progress {
  const progress = loadProgress(planId)
  if (!progress.doneSteps.includes(stepId)) {
    progress.doneSteps = [...progress.doneSteps, stepId]
    saveProgress(planId, progress)
  }
  return progress
}
