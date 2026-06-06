# UI kit · App (B2C)

The end-user experience — the calm concierge. Mobile-first vertical "trail".

- **`index.html`** — interactive demo. Two screens (Accueil ↔ Plan complet), a
  consent dialog with the disclosure slider, and a working **C’est fait** flow that
  advances the next action, updates progress, syncs the trail, and fires a sober toast.
- **`app.css`** — kit-only shell/layout (phone frame, app bar, screens). Composes the
  design-system tokens & components; defines nothing the product wouldn't.
- **`app.js`** — vanilla interactions (navigation, theme toggle, consent, advance).

Built entirely on the DS: `.ts-action`, `.ts-trail`, `.ts-glyph`, `.ts-card`,
`.ts-progress`, `.ts-banner`, `.ts-badge`, `.ts-pay`, `.ts-dialog`, `<disclosure-slider>`.

Recreated from the brand brief (no upstream Figma/codebase). The light/dark toggle
top-right is kit chrome, not part of the product UI.
