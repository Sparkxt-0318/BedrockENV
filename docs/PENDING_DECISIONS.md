# Pending Decisions

Items requiring a judgment call before action is taken. Each entry includes options and a recommendation.

---

## 1. Large-file refactoring — which files to split and how

**Date logged**: 2026-07-05  
**Routine area**: Section 5 — Code health

Five files exceed the 400-line refactor threshold:

| File | Lines | Nature |
|------|-------|--------|
| `app/intelligence/redlining/RedliningClient.tsx` | 556 | Client component: D3 charts + scrollytelling layout + data transforms |
| `components/report/ContaminationMap.tsx` | 513 | Mapbox GL map + layer toggles + popup logic + legend |
| `app/intelligence/flood-contamination/FloodContaminationClient.tsx` | 491 | Same pattern as SoilCrisisClient (D3 choropleth + scatter + bar charts) |
| `lib/data-sources/usda-ssurgo.ts` | 436 | Single data-source client — large because SSURGO API is complex |
| `app/intelligence/soil-crisis/SoilCrisisClient.tsx` | 426 | D3 choropleth + scatter + bar charts + scrollytelling |

**Options**:

**A. Split each file** — extract D3 chart logic into `components/charts/`, extract data transforms into separate utils, keep the page component thin.  
*Pro*: meets the routine standard, easier to test chart components individually.  
*Con*: significant refactor effort (~0.5 day per file), risk of regressions in complex D3/Mapbox code, no functional change for users.

**B. Raise the threshold to 600 lines for client components** — the 400-line rule is more relevant for library code than for page-level React components that orchestrate many concerns.  
*Pro*: zero effort, avoids risk.  
*Con*: sets a precedent for accumulating large files.

**C. Refactor only `usda-ssurgo.ts`** — it's a library module (not a page component) and the clearest candidate for splitting into: request helpers, response parsers, and the public-facing scorer.  
*Pro*: targeted, addresses the highest-value case (library code benefits most from decomposition).  
*Con*: leaves the four client components untouched.

**Recommendation**: **C** for now. `usda-ssurgo.ts` is the best candidate because it's library code with distinct concerns (HTTP client, response parsing, scoring). The four client components are hard to split without significant D3 state-threading work — defer until a design refresh forces a component restructure anyway.

---

## 2. Major dependency upgrades

**Date logged**: 2026-07-05  
**Routine area**: Section 5 — Code health

The following major-version updates are available:

| Package | Current | Latest | Breaking change risk |
|---------|---------|--------|---------------------|
| `@types/node` | 20.x | 26.x | Low — type-only |
| `eslint` | 9.x | 10.x | Medium — config format may change |
| `typescript` | 5.x | 6.x | Medium — strict mode changes |
| `puppeteer` | 24.x | 25.x | Low — test tooling only |

**Options**:

**A. Upgrade all at once** — faster to batch, but harder to isolate the source if something breaks.

**B. Upgrade in order: @types/node → puppeteer → eslint → typescript** — lower-risk packages first, validate CI at each step.

**Recommendation**: **B** when the user has time to babysit a CI run. None of these are security issues — safe to defer to next scheduled monthly audit (August 2026).

---
