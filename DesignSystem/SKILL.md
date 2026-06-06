---
name: thesteps-design
description: Use this skill to generate well-branded interfaces and assets for thesteps (thesteps.to), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, the proprietary step glyph, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

thesteps turns life's big projects into guided, step-by-step plans. The brand is a
**calm concierge** — every screen should lower the user's heart rate. The signature
move is **one next action at a time**; the signature mark is the **step glyph** (a
circle-based waypoint with six states: done / current / locked / waiting / overdue /
node). French-first copy, addressing the user as "vous"; the service speaks in the
first person ("Je m'occupe du reste"). Trust is visual: data-sharing is shown as
shared-vs-protected, never "missing".

Key files:
- `styles.css` — the single entry point; `@import`s all tokens + component CSS.
- `tokens/` — colours (incl. the step-state vocabulary), type, spacing, elevation, motion.
- `css/` — hand-written component CSS (`.ts-btn`, `.ts-card`, `.ts-action`, `.ts-trail`,
  `.ts-glyph[data-state]`, `.ts-shared`, `.ts-plan`, `.ts-disclosure`, …).
- `js/components.js` — dependency-free Web Components (`<disclosure-slider>`, `TsToast`).
- `assets/` — logo, favicon, and `step-glyph.svg` (the canonical SVG sprite).
- `ui_kits/` — full-screen recreations: `app/` (B2C), `marketplace/`, `pro/`, `author/`.
- `guidelines/` + `components/` — specimen & component cards (each an `.html` you can open).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets
out and create static HTML files for the user to view — link `styles.css`, use the
`.ts-*` classes and `.ts-glyph[data-state]`, and stay within the calm, low-density,
generous-whitespace aesthetic. If working on production code, the stack is strict
TypeScript → dependency-free JS, native Web Components, hand-written CSS (no React, no
Tailwind, no CSS-in-JS) with a ~12 kB gzipped JS budget — keep it that way.

If the user invokes this skill without other guidance, ask them what they want to build
or design, ask a few focused questions, and act as an expert designer who outputs HTML
artifacts _or_ production code, depending on the need.
