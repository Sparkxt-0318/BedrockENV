# Pending Decisions

Items that require a judgment call (pricing, branding, scope, architecture) and need the user's input before action is taken.

---

## 1. Refactor files >400 lines

**Date flagged**: 2026-08-06

**Files affected**:
| File | Lines | Risk |
|------|-------|------|
| `app/intelligence/redlining/RedliningClient.tsx` | 556 | Medium — React scrollytelling; splitting requires care to avoid prop-drilling regressions |
| `components/report/ContaminationMap.tsx` | 513 | Medium — complex Mapbox integration; split into `useMapLayers` hook + render layer |
| `app/intelligence/flood-contamination/FloodContaminationClient.tsx` | 491 | Medium — similar to redlining client |
| `lib/data-sources/usda-ssurgo.ts` | 436 | Low — pure data logic; clean split into fetch + parser + aggregator |
| `app/intelligence/soil-crisis/SoilCrisisClient.tsx` | 426 | Medium — D3 choropleth client |

**Recommendation**: Start with `lib/data-sources/usda-ssurgo.ts` — it's pure TypeScript with no React, already well-tested, and cleanly splits into three concerns:
1. `usda-ssurgo-query.ts` — SQL template + SDA fetch
2. `usda-ssurgo-parser.ts` — `parseSdaResponse()` + row typing
3. `usda-ssurgo-aggregator.ts` — `aggregateRows()` + component weighting

For React clients: each could extract a custom hook (`useRedliningData`, `useMapLayers`) to bring component files under 300 lines while keeping the JSX together.

**Question for user**: Should I refactor all five in a batch (one PR each), or prioritize `usda-ssurgo.ts` only and leave the React clients for later?

---

## 2. EJ Layer API access

**Date flagged**: ongoing (from prior cycles)

**Context**: The EJ layer (15% weight in composite score) returns 0 for all addresses because EJScreen and CDC SVI require external API credentials. Without it, high-EJ-burden cities (South LA, Port Arthur, Newark, Flint) score 10-20 points lower than ground truth.

**Options**:
- A. Register for EPA EJScreen API key (free, requires EPA account)
- B. Bundle a pre-computed EJScreen percentile dataset (similar to the UCMR5 and nonattainment bundles)
- C. Leave as-is until user prioritizes

**Recommendation**: Option B (bundled dataset) — removes runtime API dependency, faster, aligns with existing architecture pattern. Would need a one-time build script to pull from EJScreen's downloadable dataset.

---

## 3. Superfund Static Bundle

**Date flagged**: ongoing (from prior cycles)

**Context**: FRS SEMS radius search misses some large NPL sites (confirmed: Tar Creek/Picher, Camp Lejeune). A static bundle of ~1,300 active NPL site centroids would eliminate this gap.

**Status**: Listed as "In Progress" in ROADMAP.md but not yet built.

**Recommendation**: Build the static bundle — it's a one-time data engineering task with no runtime API dependency. Estimated 0.5 days.
