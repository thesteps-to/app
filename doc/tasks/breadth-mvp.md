# Task: breadth-first MVP skeleton

Read `CLAUDE.md` first (section "MVP strategy: breadth-first skeleton, one deep vertical").
Work task by task, in order. Commit (and push) after each task so the Cowork side can follow.
Do not edit `CLAUDE.md` or `client/public/plans/*.json` content: those are owned by the
strategy/content side; flag inconsistencies instead of fixing them silently.

## Task 1 — extend the common model

- `Step.requires?: string[]` — ids of steps that must be done first. A plan becomes a DAG;
  validate that references exist and that there is no cycle.
- `Step.payment?: { label: string, estimate?: string }` — paid service at this step.
- `Step.inputs?: DossierField[]` with
  `DossierField { id, label, type: "text" | "number" | "choice", choices?, sensitivity: "contact" | "project" | "financial" }`.
  Same field id across steps/plans = same dossier entry (asked once).
- New `Author { id, name, bio?, videoUrl? }`.
- New `Rating { average: number, count: number }` and
  `Review { author: string, text: string, date: string }`.
- `Plan` gains `author: Author`, `rating?: Rating`, `reviews?: Review[]`,
  `needTags: string[]`, `demo?: boolean`.
- `Dossier { values: Record<string, unknown>, sharing: { defaultLevel: "contact" | "project" | "financial", perProvider?: Record<string, string> } }`
  stored alongside `Progress` in localStorage.
- `unlockedSteps(plan, progress): Step[]` — steps whose requirements are all done and which are
  not done themselves. `nextStep` remains for linear plans (= first unlocked).
- Unit tests: DAG validation (missing ref, cycle), unlocking logic, dossier field merging.

## Task 2 — discovery flow (client)

- Landing page `/`: free-text need input, brand promise copy; no plan rendered at root anymore.
- Results page `/search?q=...`: plans ranked by naive fit (needTags/title/summary match) then by
  rating. Top result highlighted as "Recommandé". Each card: title, author, rating, summary.
- Plan presentation page `/plan/<id>`: what we will do, author (name, bio, rating), reviews,
  video placeholder if `videoUrl`, CTA "Commencer ce plan" → execution; link back to results.
- Generic need URLs (`/buyahouse`): results pre-filtered on that need; if a single plan matches,
  go straight to its presentation page.
- Execution view: if several steps are unlocked (DAG), show them as a short list of next-action
  cards instead of a single one.
- Demo plans (`demo: true`) display a visible "Données de démonstration" banner.

## Task 3 — provider and author journeys (minimal, demo-grade)

- `/pro`: provider registration (category, email) stored locally; mock lead reception: consent
  summary (recipient, fields, purpose) → "dossier envoyé" → tracked "affaire conclue"
  confirmation link (mock).
- `/author`: plan submission stub (paste JSON, run model validation, show errors); author
  dashboard mock with demo usage/rating/remuneration figures.

## Content (owned by the strategy side, do not write)

Demo plans will land in `client/public/plans/`: `createmycompany` (non-linear, DAG),
`learntocode` (steps with payments), plus authors/ratings/reviews demo data. `buyahouse` stays
real (no `demo` flag).

## Acceptance

- `npm run typecheck` and `npm test` pass after each task.
- Later: one Playwright e2e on the happy path (need → results → presentation → first step done).
