# thesteps.to

Free online service guiding users through long/complex personal projects ("plans" made of steps).
Revenue: business-provider commissions from service providers suggested at relevant steps.

## Vision

A user states a need (e.g. "buy a house"); thesteps.to provides a personalized, step-by-step plan.
Each plan is reachable through a generic URL: `thesteps.to/buyahouse`, `thesteps.to/createmycompany`.
At steps requiring an external provider (broker, notary, contractor...), vetted providers are
suggested; they pay a commission to thesteps.to when the user becomes their client.
Plans are authored by experts (human or AI) and rewarded on verified outcomes and quality ratings,
not raw popularity. Completing one project naturally leads to the next (buy → renovate → insure),
compounding knowledge of the user.

## Why this reboot (lessons from v1, 2023-2024)

The v1 (github.com/Javarome/thesteps) pursued two goals at once: the product AND proving it could
be built in pure vanilla JS. Combined with a GCP auth blocker, it stalled. Rules for v2:

1. Product first. Validate one vertical with real providers before any platform generality.
2. Vanilla JS remains, but as a durability/simplicity choice, not a demonstration goal.
3. No infrastructure before it is needed. Especially: no auth until a feature truly requires it.

## Product principles

The promise is cognitive relief ("we handle it for you"), not exhaustiveness. A detailed plan is
necessary internally, but showing it all up front recreates the burden the product is meant to
remove.

- Default UI: ONE next action, prepared as concretely as possible (draft email, call script,
  required information already gathered), with a single "done" confirmation. No checklist walls.
- The full plan stays accessible on demand (secondary view) for users who want the details.
- Step completion signals, by order of preference: (1) the partner provider notifies us that the
  deal was concluded — this is also the billing trigger; (2) tracked affiliate link/code;
  (3) user-declared completion as fallback.
- Commission enforcement against non-reporting providers: prepaid leads, split payment (part on
  lead delivery, part on conclusion), and blacklisting non-payers in favor of paying competitors.
- The information collected from the user across steps forms a reusable "dossier". This dossier
  is the qualified-lead asset promised to providers (and what justifies a high price per lead),
  and it compounds across successive projects. Collecting it must FEEL like the product working
  for the user ("we prepare your file"), never like form-filling for its own sake.
- Users hold the power over their data. Nothing from the dossier is ever transmitted without
  explicit, per-handoff consent: the user sees exactly which fields would go to which provider
  and can withhold any of them, globally or per provider. The product may explain the trade-off
  (a fuller dossier gets better service), but the choice is always the user's. This is the
  founding differentiator vs the social-network model (user data sold without control).

## Dossier and consent model (to implement)

- `Step.inputs`: fields a step collects (id, label, type, sensitivity: contact | project |
  financial). Asked once, stored in the user's `Dossier`, reused across steps and plans.
- `Dossier`: field values + sharing preferences (default sharing level, per-provider overrides).
- Provider handoff: a reviewed, user-approved subset of dossier fields. The consent screen lists
  recipient, fields, and purpose. GDPR-compliant by construction.
- Disclosure is a slider, not a wall of toggles: the user picks a detail level, and the UI shows
  the impact — including the estimated price/relevance of the service quote a provider can make
  with that level of detail. Fuller dossier → more precise quote (and higher lead price paid by
  the provider), which aligns user control with the business model instead of fighting it.

## User roles (distinct UIs)

Value split: the plan and its personalized accompaniment are the value FOR THE USER (free);
the dossier is the value FOR THE PROVIDER (paid).

1. Plan user: follows a plan, builds their dossier, controls disclosure. Anonymous-first
   (localStorage), account only when sync/handoff requires it.
2. Service provider: registers to receive qualified leads at the steps where their category is
   needed, confirms concluded deals (the billing trigger). MVP: handoff by email + a tracked
   confirmation link — no provider portal before there are providers.
3. Plan author (expert, human or AI): submits and maintains plans, paid on verified outcomes and
   ratings. Out of MVP scope; the open authoring marketplace is a later phase.

## MVP strategy: breadth-first skeleton, one deep vertical

The MVP shows the WHOLE product scope ("an Amazon of projects"): every user journey exists
end-to-end, even where thin or simulated. Purpose: measure how subsystems impact each other, and
show investors the full scope. Demo data (sample plans, simulated providers, ratings) is allowed
but clearly labeled. ONE vertical stays real and deep: home buying ("Acheter un logement", plan
content + affiliate links + metrics), as the validation pilot for the commission model.

Journeys to cover end-to-end:

- Plan user: express need → choose plan → execute (next-action view) → provider handoff with
  consent → conclusion → rate the plan and the provider.
- Service provider: register → receive a qualified lead → confirm the concluded deal (billing
  trigger).
- Plan author: submit a plan → publication → see usage/ratings → remuneration statement.

### Discovery flow

1. Landing page: the user expresses their need/project (free input).
2. Results: recommended plans ranked by fit to the expressed need, user profile, and qualitative
   popularity (ratings of the plan AND of its providers). One plan highlighted as "recommended",
   Amazon-style. Ranking can start naive (tag matching); AI matching is a later layer.
3. Plan presentation page: what we will do for the user, the author (name, rating, reviews),
   ideally an explainer/marketing video provided by the author. The user approves or goes back.
4. Execution: the next-action view.

Generic need URLs (`/buyahouse`) point at the results/presentation for that need; individual
plans also have their own URL.

### Plan diversity to demonstrate

- Linear plans (buyahouse) and non-linear ones (step dependencies, optional branches).
- Steps with a payment (paid service at that step) and without.
- Several competing plans for the same need, differentiated by ratings and authors.

Success metrics (real vertical): users starting the plan, step completion rate, clicks on
provider suggestions, and (later) confirmed conversions.

## Technical principles

- TypeScript sources (strict), compiled to dependency-free vanilla JS. Web Components where
  structure helps. No framework: the shipped output must stay framework-free.
- Plans are data: JSON (or Markdown + frontmatter) files, versioned in the repo.
- Static-first deployment (Netlify / GitHub Pages / Cloud Run static). No server until needed.
- User progress: localStorage first. Auth and server-side state only when sharing/sync demands it.
- Tests: Playwright for e2e on the critical path (open plan → complete a step → click provider).
- AI usage (plan personalization, accompaniment) is a later, premium layer — the free plan must
  work with zero token cost.

## Conventions

- Language: code, comments and docs in English; UI copy in French first (i18n-ready keys).
- Keep modules small and dependency-free; every npm dependency must be justified.
- Generic plan URLs are the product's distribution: each plan page must be shareable, SEO-friendly
  and fast (static HTML render).

## Repository layout (org: thesteps)

Single product repo to start. Candidate later splits (only when needed): plans content repo,
brand/site repo. The v1 monorepo (Javarome/thesteps) is inspiration material only — do not port
its GCP auth or server stack.
