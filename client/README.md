# @thesteps/client

Static-first website rendering plans at generic URLs (`thesteps.to/buyahouse`).

- Vanilla JS + Web Components; Vite is used for dev comfort and bundling only.
- Plans are JSON files in `public/plans/`, validated by `@thesteps/common`.
- User progress is stored in `localStorage` (no account, no server).
- `public/_redirects` provides the SPA fallback for Netlify-style hosting.

```bash
npm run dev      # http://localhost:5173/buyahouse
npm run build
```
