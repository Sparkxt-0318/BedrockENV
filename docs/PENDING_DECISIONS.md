# Pending Decisions

Items that require a judgment call (pricing, branding, scope, architecture) before work can proceed. Updated by the autonomous improvement routine; reviewed by the user at next session.

---

## PD-001 — Superfund static bundle vs. live API

**Date raised**: 2026-08-10
**Area**: Data accuracy / Code health

**Background**: FRS/SEMS radius queries miss large-footprint NPL sites (Tar Creek/Picher, Camp Lejeune). A static bundle of ~1,300 active NPL sites (name, lat/lng, FIPS) would fix this and eliminate API timeout risk for Superfund proximity.

**Options**:
A. Build static bundle from EPA NPL site CSV (one-time prep, ~0.5 day). Replace SEMS API with bundle lookup for NPL proximity. Keep SEMS for non-NPL RCRA/corrective-action sites.
B. Continue with live SEMS API only. Accept known gaps at Picher, Camp Lejeune, and similar sites.
C. Hybrid: static bundle for NPL tier-1 sites (>$100M cleanup estimate), live API for remainder.

**Recommendation**: Option A. The NPL list is stable (sites are added/removed infrequently), the CSV is publicly available, and eliminating timeout risk improves score reliability for all users. This is already listed as "In Progress" in ROADMAP.md but has no associated PR. Estimated 0.5 day.

---

## PD-002 — EJ layer API key acquisition

**Date raised**: 2026-08-10
**Area**: Data accuracy / New features

**Background**: The EJ layer (15% of composite score) returns 0 for all addresses because EJScreen and CDC SVI require API credentials. South LA, Flint, Port Arthur all under-score by 15–25 points. This is the single highest-leverage fix available.

**Options**:
A. Register for EJScreen EJAM API (free, requires EPA registration) and CDC SVI API (free, requires CDC account). Set credentials as environment variables. Implement the `epa-ejscreen.ts` and `cdc-svi.ts` data sources already stubbed in the codebase.
B. Build a static EJ bundle from downloaded EJScreen CSV (full national dataset) — no API key needed, but ~50MB bundle size, needs refresh process.
C. Use Census ACS demographic data already available (race/income/poverty at tract level) as a proxy EJ score without external API. Lower accuracy but no API key needed.

**Recommendation**: Option A first, Option B as fallback if API registration is slow. Option C is already partially implemented via the Census lead-risk proxy in the water scorer. The EJScreen EJAM API is straightforward and free — this should be the first thing the user does when they return.

**Action needed from user**: Register at https://www.epa.gov/ejscreen/ejscreen-api and https://www.cdc.gov/places/index.html. Provide API keys as `EJSCREEN_API_KEY` and `CDC_SVI_API_KEY` env vars.

---

## PD-003 — Files over 400 lines requiring refactoring decision

**Date raised**: 2026-08-10
**Area**: Code health

**Background**: Routine scan found these files over 400 lines (rule: refactor into smaller modules):
- `tests/integration/run-all.ts` (969 lines) — test orchestrator
- `scripts/build-scvi-national.ts` (803 lines) — data pipeline script
- `scripts/build-redlining-data.ts` (613 lines) — data pipeline script
- `app/intelligence/redlining/RedliningClient.tsx` (556 lines) — page client component
- `scripts/build-scvi-nj-pilot.ts` (550 lines) — data pipeline script
- `components/report/ContaminationMap.tsx` (513 lines) — report component
- `app/intelligence/flood-contamination/FloodContaminationClient.tsx` (491 lines) — page client component
- `lib/data-sources/usda-ssurgo.ts` (436 lines) — data source

**Options**:
A. Refactor all files over 400 lines immediately (one PR per file).
B. Refactor only library/component files (skip scripts and test orchestrators, which are less frequently read).
C. Raise the threshold to 600 lines for scripts and test files, keep 400 for library/component files.

**Recommendation**: Option C. Scripts and test orchestrators grow naturally large without the maintenance cost of library files. Priority refactors: `components/report/ContaminationMap.tsx` (513 → extract layer renderers), `app/intelligence/redlining/RedliningClient.tsx` (556 → extract chart components), `lib/data-sources/usda-ssurgo.ts` (436 → extract query builder).

**Decision needed**: Confirm threshold policy and prioritization before opening refactor PRs.
