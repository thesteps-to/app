# Task 3 — provider and author journeys (demo-grade)

Read `CLAUDE.md` first (sections "Product principles", "Dossier and consent model", "User roles").
This task completes the breadth-MVP skeleton from `doc/tasks/breadth-mvp.md`.
Everything is client-side and demo-grade: no server, no real auth, localStorage only.
Demo screens carry the existing "Données de démonstration" banner.
Do not edit `CLAUDE.md` or `client/public/plans/*.json`; flag inconsistencies instead.
Commit and push after each sub-task (3a, 3b, 3c, 3d).

## 3a — Dossier collection and consent handoff (user side)

The bridge between the user journey and the provider journey.

- In the execution view, render `Step.inputs` as form fields inside the next-action card.
  Values are saved to a `Dossier` in localStorage (`thesteps.dossier`), keyed by field id,
  SHARED across plans (same field id = asked once). Pre-fill and visually mark fields already
  known ("déjà dans votre dossier").
- When a step has `providers`, add a "Être mis en relation" button next to each provider
  suggestion. It opens the consent screen:
  - recipient (provider label/category) and purpose (the step title);
  - the disclosure slider with the three levels (contact / project / financial), defaulting to
    the dossier's `sharing.defaultLevel`;
  - the EXACT list of dossier fields transmitted at the chosen level (a field is transmitted if
    its sensitivity is at or below the chosen level), with the qualitative impact line
    ("Avec ce niveau de détail, le professionnel peut vous faire une proposition ferme /
    une estimation / seulement vous recontacter");
  - nothing is transmitted without explicit confirmation; "Annuler" is always available.
- On confirmation: record a `Handoff { id, planId, stepId, providerType, level, fields, date,
  status: "sent" }` in localStorage (`thesteps.handoffs`) and show "Dossier envoyé" on the step.
- Unit tests in common: field filtering by disclosure level (pure function, e.g.
  `sharedFields(dossier, inputs, level)`).

## 3b — Provider journey (`/pro`)

- `/pro` landing: pitch for professionals ("Recevez des dossiers qualifiés, payez au résultat"),
  registration form (category among the provider types used in the plans, email, region) saved to
  localStorage (`thesteps.pro`).
- Once "registered", show the lead inbox: the user's own handoffs whose `providerType` matches
  the registered category (this makes the demo self-contained in one browser), plus 2-3 fabricated
  demo leads so the inbox is never empty.
- Lead detail: transmitted fields visible; non-transmitted fields shown locked
  ("Non partagé à ce niveau de divulgation") — this demonstrates lead pricing by disclosure level
  (display an indicative price tier per level).
- "Affaire conclue" button on a lead: sets the handoff status to "concluded", adds a line to a
  mock billing list ("Commission due"), AND marks the related step as done in the user's
  progress — demonstrating in one browser the full notification loop (provider confirmation =
  billing trigger = step completion signal).

## 3c — Author journey (`/author`)

- `/author` landing: pitch ("Publiez vos plans, soyez rémunérés sur les résultats").
- Plan submission stub: a textarea where JSON is pasted, validated with `createPlan`; show
  validation errors precisely, or a success preview (presentation-page card) when valid. No
  persistence beyond localStorage (`thesteps.author.drafts`).
- Author dashboard (demo data, labeled): plan usage counts, rating breakdown, reviews, and a
  remuneration statement (e.g. commissions attributed to the plan's concluded handoffs).

## 3d — Navigation and polish

- Footer (or header) gains links: "Professionnels" → `/pro`, "Auteurs de plans" → `/author`.
- All new routes registered in the router with proper titles.
- One Playwright e2e for the demo loop: express need → choose plan → fill a dossier field →
  handoff with consent → register as matching provider in `/pro` → "Affaire conclue" → back to
  the plan: step is done.

## Acceptance

- `npm run typecheck` and `npm test` pass after each sub-task.
- The whole loop above works in a fresh browser profile with no console errors.
