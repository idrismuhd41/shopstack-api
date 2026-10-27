# Security Notes

## Dependency Audit — 2026-10-27

`npm audit` reports 6 advisories (5 high, 1 critical). All are reviewed below.

### Analysis

| Package | Severity | Reached Via | Reachable in Production? | Status |
|---------|----------|-------------|--------------------------|--------|
| `tar` | Critical | `bcrypt` → `@mapbox/node-pre-gyp` | ❌ Install-time only — extracts prebuilt bcrypt binary from npm registry | Deferred |
| `deepmerge-ts` | High | `prisma` → `@prisma/config` | ❌ Build-time only — merges developer-controlled config | Deferred |
| `zod` | High | Direct | ⚠️ Runtime, but vulnerable pattern (oversized arrays) unused in this project | Deferred |

### Why Defer?

- **`tar`** — `npm audit fix` cannot resolve without conflicting with `@mapbox/node-pre-gyp`'s version range. Install-time only; no user-supplied archives enter this path.
- **`deepmerge-ts`** — Fix requires Prisma 7 (major version bump). Prisma 6 is what Task 5 will use. Dev-only.
- **`zod`** — Fix requires Zod 4 (`.email()` API changed, schema migration required). The vulnerable pattern (large array validation) is not used. All schemas validate flat string fields.

### Mitigations

- `npm audit fix` run (correctly identified none safely fixable without major bumps).
- bcrypt verified functional after install.
- Post-internship plan: upgrade Prisma to v7 and Zod to v4 with code migration.

### CI Integration

The GitHub Actions workflow (Task 7) will run `npm audit --production` to gate on production runtime vulnerabilities only. Dev-only advisories do not block merges.