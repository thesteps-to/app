# thesteps.to app

Monorepo (npm workspaces) for [thesteps.to](https://thesteps.to): free guided plans for personal
projects, monetized through business-provider commissions.

See [claude.md](claude.md) for the vision, MVP scope and technical principles.

## Workspaces

- [common](common/README.md): framework-free domain model (plans, steps, progress).
- [client](client/README.md): static-first website rendering plans at generic URLs
  (e.g. `thesteps.to/buyahouse`).

A `server` workspace will be added only when a feature requires it (no infra before need).

## Usage

```bash
npm install
npm run dev    # client dev server
npm test
npm run build
```
