# thesteps · Design System

> **thesteps.to** turns life's big projects — buying a home, starting a company,
> planning a trip — into guided, step-by-step plans. The user only ever sees their
> **next action**; the service prepares everything behind the scenes, builds their
> dossier as they go, and connects them with vetted professionals at the right
> moments — sharing only the data the user explicitly approves. Free for users,
> funded by referral commissions. An *"Amazon of projects"*: plans authored by
> experts, rated by outcomes, recommended by fit.

This repository **is** the design system: design tokens (CSS custom properties),
the brand's proprietary **step glyph**, reusable UI components, and full-screen
UI kits for the three audiences. It is authored so an automated compiler can
bundle the components and index the tokens for consuming projects.

---

## Sources & provenance

This system was built **from a written brand brief**, not from an existing
codebase or Figma file. There is therefore no upstream design source to link.
If/when these exist, record them here:

- **Production codebase:** _none supplied_ (target stack: strict TypeScript →
  dependency-free JS, native Web Components, hand-written CSS; ~12 kB gzipped JS budget).
- **Figma:** _none supplied._
- **Live product:** thesteps.to (referenced conceptually in the brief).

> ⚠️ **Substitutions to confirm with the user** (see CAVEATS at the bottom):
> system-ui type (no webfont shipped, by design); Lucide icons via CDN for
> generic UI glyphs (the brand's own sprite covers only the step states).

---

## The three audiences, one system

| Surface | Audience | Voice & density |
| --- | --- | --- |
| **App** (B2C, default) | End users mid-project | Warm, simple, **one thing at a time**. Lots of air. |
| **/pro** | Service providers | Businesslike. Lead inbox, billing. Denser. |
| **/author** | Plan authors | Creator-economy. Stats, ratings, the `--accent-author` plum. Denser. |

Same tokens, three densities. The B2C app is the reference implementation of the
brand's soul; pro/author surfaces inherit the tokens but pack more in.

---

## CONTENT FUNDAMENTALS

**Language.** French-first, i18n-ready. All product copy is written in French;
keys are structured for translation. Examples below are the canonical strings.

**Voice — a trusted advisor who says "I'll handle it."** Calm, competent,
reassuring. Never bureaucratic, never gamified-childish. The user arrived stressed;
copy lowers their heart rate.

- **Address the user as "vous"** — respectful concierge, not a buddy. ("Voici votre
  prochaine étape.")
- **The service speaks in the first person when it acts for you:** "Je m'occupe du
  reste", "Je vous préviens dès que le notaire répond." This is the brand's
  signature — the system is a competent agent doing work on your behalf.
- **Reassurance over instruction.** Prefer "C'est prêt quand vous l'êtes" over
  "Complétez ce formulaire."

**Casing.** Sentence case everywhere — titles, buttons, labels. **No Title Case,
no ALL-CAPS** except the tiny `.eyebrow` section labels (e.g. `ÉTAPE 4 / 9`).
French spacing rules apply (espace insécable before `: ; ! ?`).

**The primary CTA is always singular and human.** One per screen:
- `C'est fait ✓` — mark the current step done.
- `Voir le plan complet` — the deliberate click into detail.
- `Je m'en occupe` / `Lancer cette étape`.

**Plain language, never legalese** — especially around data. Not "Consentement au
traitement des données financières" but **"Partager mon budget avec le courtier ?"**
with a one-line "pourquoi" beneath.

**Locked steps explain themselves in human words:** `Disponible après le compromis`
— never a bare padlock, never "requirement not met".

**Waiting is framed as relief:** `En attente du notaire — ce n'est pas à vous de
jouer.` The cognitive message is always *"it's them, not you."*

**Time phrasing.** Under 30 days, say days-left: `J-12`, `Plus que 3 jours`. Beyond
that, soft estimates: `~2 semaines`, `Courant juin`. Never an anxiety countdown on
something the user can't influence.

**Progress is celebrated soberly:** `4 / 9 étapes faites`, `Belle avancée.` No
confetti storms, no exclamation pile-ups. A single calm check.

**Emoji:** used **sparingly and functionally**, never decoratively. The sanctioned
set is small and consistent:
- `✓` completion (often rendered as the green check glyph, not the emoji)
- `💳` payment hint, always paired with an estimate: `💳 Estimation ~1 200 €`
- That's essentially it. No 🎉, no 🚀, no faces. If an emoji isn't carrying
  information, delete it.

**Demo / disclosure / sponsored states have honest copy:**
- Demo banner: `Données de démonstration` (never hidden, never fake-real).
- Provider links: visibly marked, `rel="sponsored"`, labelled `Suggéré`.
- Estimates are always "estimation", never a firm price.

---

## VISUAL FOUNDATIONS

**Overall vibe.** Calm concierge. Generous whitespace, a single quiet canvas, one
loud thing per screen (the current action). Density is the enemy in the B2C app;
detail exists but lives behind a deliberate click.

**Colour.**
- **Brand blue `#2563eb`** (`--brand`) = the advisor, the current/actionable state.
  It is the *only* loud colour on a B2C screen — reserved for the one primary
  action. Used everywhere it appears, it would stop meaning "act here".
- **Green `#16a34a`** (`--step-done`) = done, progress, "shared/approved". Calm,
  never neon.
- **Amber `#e0900c`** (`--step-waiting`) = waiting on an external party, and soft
  time pressure.
- **Red `#e24545`** (`--step-overdue`) = true, actionable lateness only. Rare.
- **Plum `#6a3fc7`** (`--accent-author`) = the /author creator surfaces only.
- **Neutrals** are a cool slate — clean and trustworthy, letting the blue carry the
  warmth. Backgrounds are near-white (`--surface-app` = `#f5f7f9`), cards pure white.

**Type.** System-ui, single family, no webfont (honest, instant, zero-byte, carries
French diacritics natively). Expression comes from **weight and size**, not from
font-swapping. Headings semibold/bold with tight tracking; body regular at 1.5
line-height; a system **mono** for amounts, dates, and `J-12` badges (tabular feel).

**Spacing.** 4px grid. The app leans on the large end of the scale — `--space-lg`/
`--space-xl` between elements, a narrow `--width-action` (448px) reading column so
the next-action card is centred and uncrowded.

**Backgrounds.** Flat, near-white surfaces. **No photographic hero backgrounds in
the app, no gradients-as-decoration.** The one sanctioned "texture" is the **faint
trail** — a subtle vertical path line behind the step nodes (the mobile metaphor).
Marketing surfaces may use a single soft brand-tinted wash, never a saturated
purple-blue gradient.

**The card.** Signature radius `--radius-card` (18px). White surface, **soft diffuse
shadow** (`--shadow-md`) — cool-tinted, low-contrast, never a hard drop. Border is
usually shadow-only; when a hairline is needed it's `--border-subtle`. The
**current action card** is the exception: it gets the brand-tinted `--shadow-current`
glow and a `--step-current-bd` hairline so it lifts off the page.

**Borders & radii.** Hairlines are 1px `--border-subtle`/`--border-default`. Radii
climb: inputs 10px, buttons/chips 14px, cards 18px, sheets 24px, pills/avatars full.
Nothing in the system has a 0px corner.

**Shadows.** A soft 5-step elevation ramp, all cool-grey and diffuse. There is **no
inner-shadow skeuomorphism** except sunken tracks (progress, sliders). The only
coloured shadow is the brand glow on the current card.

**Elevation logic.** app → card (shadow-md) → overlay/dialog (shadow-xl) → toast.
The current action card sits one notch "louder" than peers via colour + glow, not
via a bigger shadow.

**Motion.** Gentle and confident — `--ease-out` settle, `--dur-base` 220ms. Cards
**rise-in** (8px, fade) when they appear. Step completion is a **deliberate
520ms** check-draw, sober. The **only looping animation** is the slow `waiting`
pulse — calm breathing, not a nag. No bounce, no spring, no parallax. Everything
collapses to instant under `prefers-reduced-motion`.

**Hover / press.**
- Hover: a small lift (`translateY(-1px)`) and one shade darker on filled
  surfaces; soft fills (`--brand-soft`) lighten. Links underline.
- Press: scale to `--press-scale` (0.97) and the darker active colour. Tactile,
  brief.
- Focus: never removed — a 3px `--ring-focus` halo (brand-200) on everything
  interactive. WCAG AA throughout.

**Transparency & blur.** Used only for **scrims** (dialog backdrop,
`--scrim`) and the occasional sticky header with a subtle backdrop blur. Not used
decoratively. Locked/unshared data is shown as **protected** (muted slate fill,
present) — never blurred-out or removed, because "missing" reads as broken.

**Imagery.** The product is largely image-light. Where author/marketplace surfaces
show people, imagery is warm, natural-light, candid (real moments of a project
done), never stocky-corporate. Plan cards carry an author avatar + rating, Amazon-
style trust signals, kept calm and curated rather than promotional.

**The step is the brand.** See ICONOGRAPHY and the dedicated step-state vocabulary
in `tokens/colors.css`. Every plan is rendered as a **trail of waypoints**: vertical
"trail" on mobile (next-action card at the top of a faint path), full branching DAG
in the plan view, denser node renderings on pro/author dashboards — same tokens.

---

## ICONOGRAPHY

**Two distinct layers — keep them separate.**

### 1. The brand layer — the step glyph (proprietary, hand-maintained)
The central graphic element. A **circle-based waypoint**, closer to a hiking-trail
blaze or metro stop than to BPMN/UML. **No diamonds, no swimlanes, no UML arrows** —
the public must read a plan like a journey, not a flowchart.

- Source of truth: **`assets/step-glyph.svg`** — an inline SVG sprite of `<symbol>`s,
  one per state: `#step-done`, `#step-current`, `#step-locked`, `#step-waiting`,
  `#step-overdue`, `#step-node`.
- React equivalent: the **`StepGlyph`** component renders the same geometry from
  tokens (use this in JSX; use the sprite in vanilla handoff).
- The mark doubles as **logo** — the primary lockup is `assets/logo-underline.svg`
  ("Soulignement": the wordmark rides its own green trail between a green *done*
  waypoint and the loud blue *current* waypoint), with `assets/logo-thesteps.svg`
  as a standard mark+wordmark alternate, `assets/logo-mark.svg` the minimal
  horizontal mark for tight spots, and `assets/favicon.svg` the favicon.
- **Transitions** (the connectors) are first-class iconography too: solid line =
  path taken (`--path-taken`), faded = future (`--path-future`), branch = parallel
  DAG, converge = unlock-together. Drawn in CSS/SVG, never as arrowheads.

### 2. The UI layer — generic icons (Lucide, via CDN)
For ordinary affordances (chevrons, close, search, bell, user, settings, calendar,
credit-card, lock, check, etc.) the system uses **[Lucide](https://lucide.dev)** —
a clean, rounded, consistent 2px-stroke open-source set that matches the brand's
calm geometry.

> ⚠️ **Substitution flag:** No brand-specific UI icon set was supplied, so Lucide is
> a chosen stand-in. It pairs well (round caps, 2px stroke, 24px grid). If the brand
> has its own UI sprite, drop it into `assets/` and swap. The `Icon` component wraps
> Lucide so a future swap is one file.

- Loaded from `https://unpkg.com/lucide@latest` in cards/kits; in production it
  becomes a **hand-maintained subset sprite** (budget mindset — don't ship the whole
  set).
- Stroke `2`, `round` caps/joins, `currentColor` fill — icons inherit text colour.

**Emoji as icon:** only the two sanctioned functional emoji (`💳`, and `✓` where the
glyph isn't available). Never decorative emoji. No icon-font, no emoji-as-bullet.

---

## Token map

| File | Concern |
| --- | --- |
| `tokens/palette.css` | Raw primitive scales (the only hex) |
| `tokens/colors.css` | Semantic aliases, **step-state vocabulary**, dark theme |
| `tokens/typography.css` | Families, scale, weights, roles |
| `tokens/spacing.css` | 4px grid, content widths, hit targets |
| `tokens/elevation.css` | Radii + soft shadow ramp |
| `tokens/motion.css` | Durations, easing, keyframes (rise-in, waiting-pulse) |
| `tokens/base.css` | Tiny reset + element defaults + `.eyebrow` |
| `styles.css` | **Entry point** — `@import` list only |

---

## INDEX — what's in this repository

**Foundations**
- `styles.css` — entry point (`@import` list only).
- `tokens/` — `palette.css`, `colors.css` (semantic + step-state vocabulary + dark
  theme), `typography.css`, `spacing.css`, `elevation.css`, `motion.css`, `base.css`.
- `css/` — hand-written component CSS, all `@import`ed via `css/components.css`:
  `glyph.css`, `button.css`, `forms.css`, `card.css`, `badge.css`, `avatar.css`,
  `banner.css`, `overlay.css`, `trail.css`, `step-record.css` (completed-step
  record + deliverable doc + transition condition + inline focal card),
  `action-card.css`, `disclosure.css`, `shared-field.css`, `plan-card.css`.
- `js/components.js` — vanilla Web Components (`<disclosure-slider>`, `TsToast`).

**Brand assets** — `assets/`
- `logo-underline.svg` (**primary** "Soulignement" lockup — the wordmark rides its
  trail), `logo-thesteps.svg` (standard mark+wordmark), `logo-mark.svg` (minimal
  horizontal mark), `favicon.svg`, `step-glyph.svg`
  (canonical sprite: `#step-done`, `#step-current`, `#step-locked`, `#step-waiting`,
  `#step-overdue`, `#step-node`).

**Specimen cards** (Design System tab) — `guidelines/`
- Colors: brand · step states · neutrals · semantic & trust
- Type: roles · scale & mono
- Spacing: spacing scale · radius & elevation
- Brand: logo & favicon · step glyph · transition grammar

**Component cards** (Design System tab) — `components/`
- buttons · forms · badges/time/pay · cards/progress/tabs · action card · **parcours
  (completed steps + conditions)** · disclosure slider · shared-vs-protected ·
  banners & states · consent dialog · plan cards · avatars & tooltip

**UI kits** — `ui_kits/`
- `app/` — B2C app, **interactive** (the **parcours**: land on your current step with
  the past recorded above — dates, inputs, deliverables — and connectors carrying their
  condition; plus the next-action card, consent dialog, working "C'est fait" flow).
  Starting points: `start-next-action.html`, `start-consent.html`.
- `marketplace/` — browse expert-authored plans (the "Amazon of projects").
- `pro/` — provider lead inbox with consented-data detail + commission billing.
- `author/` — plan-author dashboard (stats, ratings, reviews) with the plum accent.

**Skill** — `SKILL.md` (Agent Skills-compatible) · this `readme.md` (the design guide).

> **Rendering note for DS-authored HTML:** the step glyph is used three ways — the
> `.ts-glyph[data-state]` CSS class (used in all cards/kits; renders in every capture
> path), the `assets/step-glyph.svg` `<use>` sprite (canonical for product code), and
> the literal inline `<svg>` (where a one-off is simpler). All three share one geometry.

