import { getCatalog } from "./catalog.ts"
import { renderLanding } from "./views/landing.ts"
import { renderSearch } from "./views/search.ts"
import { renderPresentation } from "./views/presentation.ts"
import { renderExecution } from "./views/execution.ts"
import { renderNotFound } from "./views/notFound.ts"

const PLAN_PATH = /^\/plan\/([^/]+?)(\/run)?\/?$/

let appHost: HTMLElement | null = null

export function startRouter(host: HTMLElement): void {
  appHost = host
  window.addEventListener("popstate", () => { void route() })
  document.addEventListener("click", handleLinkClick)
  void route()
}

export function navigate(path: string): void {
  if (path === location.pathname + location.search) return
  history.pushState(null, "", path)
  void route()
}

function handleLinkClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest<HTMLAnchorElement>("a[href]")
  if (!link) return
  if (link.target && link.target !== "_self") return
  if (link.hasAttribute("download") || link.hasAttribute("data-external")) return
  const href = link.getAttribute("href")
  if (!href || !href.startsWith("/")) return
  event.preventDefault()
  navigate(href)
}

async function route(): Promise<void> {
  if (!appHost) return
  const host = appHost
  const path = location.pathname
  if (path === "/" || path === "") {
    document.title = "thesteps.to — des plans guidés pour vos projets"
    return renderLanding(host)
  }
  if (path === "/search") {
    const q = new URL(location.href).searchParams.get("q") ?? ""
    document.title = q ? `${q} — thesteps.to` : "thesteps.to — tous les plans"
    return renderSearch(host, q)
  }
  const planMatch = path.match(PLAN_PATH)
  if (planMatch) {
    const id = planMatch[1]!
    return planMatch[2] ? renderExecution(host, id) : renderPresentation(host, id)
  }
  return resolveGenericNeed(host, path.slice(1).replace(/\/$/, ""))
}

async function resolveGenericNeed(host: HTMLElement, slug: string): Promise<void> {
  if (!slug) return renderNotFound(host)
  const catalog = await getCatalog()
  const direct = catalog.find(plan => plan.id === slug)
  if (direct) {
    history.replaceState(null, "", `/plan/${direct.id}`)
    return renderPresentation(host, direct.id)
  }
  history.replaceState(null, "", `/search?q=${encodeURIComponent(slug)}`)
  return renderSearch(host, slug)
}
