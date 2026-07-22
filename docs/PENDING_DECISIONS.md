# Pending Decisions

Items that require judgment from the project owner before proceeding. Each entry includes the options and a recommendation.

---

## 1. EJ Layer Implementation Path

**Decision needed**: How should we implement the EJ layer given EJScreen API reliability issues?

**Context**: EJ scores currently return 0 for all addresses because the EJScreen REST API is unreliable (slow responses, occasional outages). This causes South LA, Flint, Port Arthur, and other high-burden communities to score 15-25 points below defensible ground truth. The EJ layer (15% weight) is the biggest single accuracy gap.

**Options**:

**A. Static nationwide bundle (recommended)**
Build a block-group-level EJScreen percentile bundle similar to how UCMR 5 and nonattainment are handled. Download the EJScreen GDB from EPA (available at https://www.epa.gov/ejscreen/download-ejscreen-data), process into a FIPS-keyed JSON or SQLite lookup, and check it into the repo. Eliminates API dependency. One-time build + quarterly refresh.

- Pros: Reliable, fast (O(1) lookup), no API key needed, survives EPA infrastructure outages
- Cons: ~2-day build effort; 50 MB+ file; requires quarterly rebuild discipline
- Estimated effort: 1 day data pipeline + 0.5 day integration + 0.5 day tests

**B. Fix the live API integration**
Diagnose the current EJScreen API failures. May be a timeout issue, CORS configuration, or query parameter problem.

- Pros: Always current data; no storage overhead
- Cons: EJScreen API documented as unreliable by EPA; same fragility as Brownfields API
- Estimated effort: 0.5-1 day, but risk of partial fix

**C. Replace EJScreen with CDC SVI only**
CDC SVI is already integrated and working. Use it alone for the EJ layer rather than EJScreen + SVI.

- Pros: Works today; no new development
- Cons: SVI is demographic only (no environmental indicators); loses environmental burden component of EJ score

**Recommendation**: Option A. The pattern (static bundle → fast lookup) has worked well for UCMR 5 and nonattainment. Reliability matters more than real-time freshness for a dataset that updates annually.

---

## 2. Superfund Static Bundle vs. API

**Decision needed**: Build a static NPL site bundle to replace the broken FRS API calls?

**Context**: The EPA FRS radius search misses known active NPL sites including Camp Lejeune (NC) and Picher/Tar Creek (OK). These are among the most contaminated places in the US and score near zero on the Superfund component. A static bundle of ~1,300 active NPL sites with coordinates would fix this. This is listed as "In Progress" in ROADMAP.md but no work has started.

**Options**:

**A. Build the static bundle (recommended)**
Download the EPA SEMS NPL site list (CSV from https://www.epa.gov/superfund/superfund-data-and-reports), geocode any sites missing coordinates via the EPA FRS API in batch (offline), and produce a `data/superfund-npl.json` bundle keyed by site ID with lat/lng, site name, status, and HRS score.

- Pros: Fixes the worst false-negative gap in the scoring engine; one-time effort + annual refresh
- Estimated effort: 1 day
- Dataset size: ~200 KB (small)

**B. Fix the FRS API radius search**
Investigate why FRS misses some NPL sites (may be a program system filter issue or a data entry gap in FRS).

- Pros: Uses official API
- Cons: Some sites (like military bases with special FRS records) may simply not be in the standard radius-search index; API will remain slow and fragile regardless

**Recommendation**: Option A. ~1,300 sites is small enough to bundle. The static approach will be faster and more reliable than the FRS API even after any fixes.

---

## 3. Embeddable Widget / API Distribution

**Decision needed**: Should we build a public API or embeddable widget for distribution?

**Context**: MARKET_INTEL.md identifies MLS/listing portal integration as the primary growth channel (following First Street's Realtor.com distribution model). Building an embeddable "Bedrock Score: 43/100" badge or an API endpoint that third parties can query would enable this.

**Options**:

**A. Public read API with API key management**
Build `/api/v1/score?address=...` returning the composite score + layer scores as JSON. Add API key issuance and rate limiting (build on the existing rate limiter).

- Pros: Maximizes integration potential; developers can build their own UIs
- Cons: Increases API cost surface (cold assessments are expensive with 10+ data source calls); needs key management, billing, documentation

**B. Embeddable badge widget (simpler)**
An `<iframe>` or `<script>` snippet that renders a "Bedrock Score" badge for a given address. No API key needed — just an address parameter.

- Pros: Simple; easy for non-developers (listing agents, website owners) to embed
- Cons: Less powerful; doesn't enable custom UIs

**C. Both A and B**
Start with the badge widget (Option B), offer the full API to developers who inquire.

**D. Not yet (wait for more signal)**
Focus on product depth (EJ layer, Superfund bundle) before distribution.

**Recommendation**: Option D for now. Fix the EJ layer and Superfund gaps first — a distribution channel that sends users to an underscoring product creates negative first impressions that are hard to reverse. Revisit when EJ layer is live.

---

## 4. Batch Assessment Feature for Pro Users

**Decision needed**: Implement CSV batch scoring?

**Context**: MARKET_INTEL.md notes that competitors (ClimateCheck) offer portfolio-level batch scoring. Real estate professionals managing multiple properties need to score a list of addresses at once. The current UX requires one-at-a-time address entry.

**Options**:

**A. CSV upload → batch scoring → downloadable results**
A Pro feature: upload a CSV of addresses, run assessments in the background (queue), email results as a CSV download + individual PDF links.

- Pros: High value for real estate professionals; drives Pro subscription adoption
- Cons: Complex infrastructure (background job queue, email delivery); 2-3 day build

**B. Multi-address UI flow**
Let users enter multiple addresses in the same session and view a comparison table.

- Pros: Simpler than background processing; no email needed
- Cons: Limited scale (browser session); no offline processing

**Recommendation**: Option B first as a quick win, then revisit Option A if batch demand materializes. Multi-address comparison in one session is achievable in 1 day and covers the most common use case (buying agent comparing 3-5 finalist properties).

---

## 5. UCMR 5 Bundle Rebuild

**Decision needed**: Trigger a UCMR 5 bundle rebuild?

**Context**: The current bundle was built from the **January 2026** quarterly release. EPA publishes new quarterly bundles; the April 2026 release (if available) may contain updated detections. The rebuild script is `scripts/build-ucmr5-data.ts`.

**Status**: Checking EPA's release page is blocked in this session (no browser access). Owner should manually verify whether a post-January 2026 bundle is available and trigger a rebuild if so.

**Action needed**: Check https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule for releases newer than January 2026. If found, run `pnpm tsx scripts/build-ucmr5-data.ts` and commit the updated bundle.

---

*Last updated: 2026-07-22*
