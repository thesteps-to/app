# UI kit · App (B2C)

The end-user experience — the calm concierge. Mobile-first vertical "trail".

- **`index.html`** — interactive demo. Two screens (Accueil ↔ **Mon parcours**), a
  consent dialog with the disclosure slider, and a working **C’est fait** flow.
- **`app.css`** — kit-only shell/layout (the phone is a fixed-height scroll viewport;
  the active screen scrolls within it). Composes the DS tokens & components.
- **`app.js`** — vanilla, **data-driven**: a single `STEPS` journey model renders BOTH
  the home next-action card and the full parcours, and one `advance()` keeps them in sync.

**The parcours** (the plan view) is the key pattern: you **land on your current step**
(auto-scrolled into place), with everything you've already done **recorded above** —
each past step folds open (native `<details>`) to show *what you entered*, the *date*,
and the *deliverable* you received; the connectors between done steps carry their
**condition** ("Offre acceptée par le vendeur · 12 mai"), the thing that unlocked the
next step. The current step is the one loud focal card; waiting/locked steps sit quietly
below. Marking a step done records it, drops a condition on its connector, and promotes
the next step.

Built entirely on the DS: `.ts-action`, `.ts-trail`, `.ts-record` + `.ts-doc` + `.ts-cond`,
`.ts-focal`, `.ts-glyph`, `.ts-card`, `.ts-progress`, `.ts-banner`, `.ts-badge`, `.ts-pay`,
`.ts-dialog`, `<disclosure-slider>`.

Recreated from the brand brief (no upstream Figma/codebase). The light/dark toggle
top-right is kit chrome, not part of the product UI.
