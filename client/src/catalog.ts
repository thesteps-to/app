import { createPlan } from "@thesteps/common"
import type { Plan } from "@thesteps/common"

// Known plan slugs. Update this list when the content side adds a new plan under
// client/public/plans/<slug>.json. A static client-side list is enough at MVP scale;
// move to a plans/index.json when the catalog grows past a handful of entries.
const SLUGS = ["buyahouse", "createmycompany", "planmyvacation"] as const

let cache: Promise<Plan[]> | null = null

export function getCatalog(): Promise<Plan[]> {
  if (!cache) cache = loadAll()
  return cache
}

async function loadAll(): Promise<Plan[]> {
  const results = await Promise.all(SLUGS.map(loadOne))
  return results.filter((p): p is Plan => p !== null)
}

async function loadOne(slug: string): Promise<Plan | null> {
  try {
    const response = await fetch(`/plans/${slug}.json`)
    if (!response.ok) return null
    return createPlan(await response.json())
  } catch (error) {
    console.error(`Failed to load plan "${slug}"`, error)
    return null
  }
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  return (await getCatalog()).find(plan => plan.id === id)
}
