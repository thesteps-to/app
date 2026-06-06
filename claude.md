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

## MVP scope: home buying (France)

One single, excellent plan: "Acheter un logement". No author marketplace, no plan editor, no
accounts. The plan is static content; personalization is a few questions up front (first-time
buyer? new/old? region? budget?) that filter/adapt the steps.

Steps cover: define budget and financing capacity, mortgage broker, search, visits, offer,
compromis, notary, closing, moving in. Each step: clear explanation, checklist, and where
relevant a provider suggestion.

Monetization test: affiliate/partner links to mortgage brokers and related providers, to validate
the commission model without negotiated contracts.

Success metrics: users starting the plan, step completion rate, clicks on provider suggestions,
and (later) confirmed conversions.

## Technical principles

- Vanilla JS (ES modules), Web Components where structure helps. No framework, no build step if
  avoidable (Vite acceptable for dev comfort, output must stay framework-free).
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
