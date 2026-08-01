# Pending Decisions

Items that require a judgment call (pricing, branding, scope, strategic direction).
Each entry has options and a recommended path. Surface these when the user returns.

---

## 1. EJ Layer API Key Strategy (Priority: High)

**Background**: The EJ layer (15% of composite score) returns 0 for all addresses because EJScreen and CDC SVI require external API access. This means South LA, Flint, Port Arthur, and Newark all under-score by 15–25 points.

**Options**:
- A) Register for EJScreen API key (free, EPA-managed, requires institutional email) and CDC SVI download (public). Self-host the SVI CSV as a bundled dataset similar to UCMR 5.
- B) Bundle EJScreen percentiles as a static dataset (similar to nonattainment.json) — download the national CSV from EJScreen's data portal and ship with the repo.
- C) Continue deferring and display a clear "EJ data unavailable" flag on affected reports.

**Recommendation**: Option B. Bundle the national EJScreen CSV the same way UCMR 5 is bundled. The file is ~50MB raw but compresses well. Avoids API key management and rate limits. Estimated effort: 1 day.

---

## 2. Pricing Model (Priority: Medium)

**Background**: Stripe infrastructure is intact but the paywall was removed (MARKET_INTEL.md notes "All features free. No paywall."). The README still says $29 consumer report, $99/mo Pro.

**Options**:
- A) Keep free forever — use as a lead-gen and research credibility tool.
- B) Re-enable the paywall at the original prices ($29 report / $99 Pro).
- C) Freemium: basic score free, full report (PDF, AI narrative, recommendations) behind $29 paywall.
- D) API-only monetization: free consumer UX, paid API for real estate portals.

**Recommendation**: Option C. The basic score and a summary card are the hook; the full PDF + AI narrative + layer-by-layer breakdown are differentiated enough to justify $29. Option D is the long-term play but requires building an embeddable widget first.

---

## 3. Superfund Static Bundle Scope (Priority: High)

**Background**: FRS SEMS API misses Camp Lejeune (active NPL), Tar Creek/Picher, and others. A static bundle of NPL sites would fix this class of error.

**Options**:
- A) Bundle all ~1,340 active NPL sites from EPA's CERCLIS dataset (CSV available at EPA.gov, quarterly refresh). ~200KB JSON.
- B) Bundle active + deleted NPL sites (~1,900 total) for broader historical coverage.
- C) Continue relying on FRS SEMS API alone.

**Recommendation**: Option A. Active NPL only is sufficient for current-risk scoring. The CERCLIS CSV download is straightforward. Estimated effort: 0.5 days to build the bundle script + 0.5 days to integrate in proximity-scorer.

---

## 4. Air API Key Registration (Priority: Medium)

**Background**: Air layer runs at ~50% coverage without AQS or OpenAQ v3 API keys. Both are free with registration.

**Options**:
- A) Register for EPA AQS API key (requires institutional account) + OpenAQ v3 (free tier, 60 req/min).
- B) Bundle AQS annual summary data as a static dataset (EPA publishes annual summaries by CBSA).
- C) Leave as-is and document the limitation.

**Recommendation**: Option B for AQS annual summaries (covers PM2.5, O3, NO2 at station level — ship annually). Option A for OpenAQ v3 as a real-time supplement. Estimated effort: 1 day.

---

## 5. Files Over 400 Lines — Refactor Scope (Priority: Low)

**Background**: Five files exceed the 400-line threshold from the code health rules:
- `app/intelligence/redlining/RedliningClient.tsx` — 556 lines
- `components/report/ContaminationMap.tsx` — 513 lines
- `app/intelligence/flood-contamination/FloodContaminationClient.tsx` — 491 lines
- `lib/data-sources/usda-ssurgo.ts` — 436 lines
- `app/intelligence/soil-crisis/SoilCrisisClient.tsx` — 426 lines

**Options**:
- A) Refactor all five into sub-components/modules this cycle.
- B) Refactor only the data-source file (`usda-ssurgo.ts`) since it has logic that benefits from unit testing; leave the visualization clients alone (D3 code is inherently long).
- C) Exempt visualization client components from the 400-line rule (they're scroll-narrative pages, not reusable modules).

**Recommendation**: Option B + C. Refactor `usda-ssurgo.ts` and `ContaminationMap.tsx` (which has mixed concerns: map init, layer management, UI). Exempt the intelligence page clients (SoilCrisisClient, FloodContaminationClient, RedliningClient) from the 400-line rule — they're page-level orchestrators, not modules.

---

## 6. Research Brief #4 Scope (Priority: Medium)

**Background**: The Water System Risk Atlas (Research Brief #4) is in-progress per ROADMAP.md. The spec is in `docs/specs/water-risk-atlas.md`.

**Options**:
- A) Full nationwide PWSID-level assessment (~50,000 community water systems) with D3 visualization.
- B) Scoped version: Top 500 water systems by population served, focusing on PFAS detection + violation history. Faster to ship, still credible.
- C) Defer until EJ layer and Superfund bundle are complete (higher scoring ROI).

**Recommendation**: Option C for now. Ship EJ layer (fixes 15% of composite score) and Superfund bundle (fixes false negatives) first. Water Atlas is high-effort content; do it after the scoring engine is accurate.
