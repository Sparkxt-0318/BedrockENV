# Pending Decisions

Items that require human judgment — pricing, branding, scope, or strategic direction. Each entry includes the options considered and a recommendation. Surface these when the user returns.

---

## PD-001 — Superfund Static Bundle vs. Live API (Priority: High)

**Background**: The EPA FRS SEMS radius search API consistently misses active NPL Superfund sites in tests — Picher/Tar Creek (score 18, expected 70+) and Camp Lejeune (score 10, expected 65+). The API appears to miss large-area Superfund sites registered at the district level rather than individual facility level.

**Options**:
1. **Build a static bundle** (~1,300 active NPL sites with centroids from EPA's CERCLIS export). Query is a simple distance calculation against a local JSON file — zero API latency, 100% coverage. Rebuild quarterly from EPA's public download. Estimated effort: 1 day.
2. **Fix the radius search** by switching from FRS SEMS to EPA's direct Superfund API (`https://cumulis.epa.gov/supercpad/`). Requires reverse-engineering the SUPERCPAD API format. Estimated effort: 2–3 days, uncertain success.
3. **Keep current behavior** with documentation that Superfund gap exists. Not recommended.

**Recommendation**: Option 1 (static bundle). Highest reliability for lowest effort. Same pattern as the nonattainment bundle which works well.

**Assigned to**: User (authorize the 1-day implementation scope)

---

## PD-002 — EJ Layer Implementation (Priority: High)

**Background**: The Environmental Justice layer (15% of composite score) currently returns 0 for all addresses. It requires external API access: EJScreen API (EPA) or CDC SVI API. Without it, high-EJ-burden areas like South LA, Flint, and Port Arthur are significantly underscored. The EJ layer would add 5–20 points to the composite for high-burden areas.

**Options**:
1. **Register for EPA EJScreen API key** (free, public API). Estimated lead time: 1–2 weeks for approval. Implementation: ~2 days once key is available.
2. **Use CDC SVI directly** (Social Vulnerability Index — publicly downloadable census-tract CSV). Bundle the CSV and query locally. Zero API dependency, quarterly refresh. Estimated effort: 1.5 days.
3. **Use both**: EJScreen for environmental justice indicators + CDC SVI for social vulnerability. Full 15% weight covered. Estimated effort: 3 days total.

**Recommendation**: Option 2 first (CDC SVI bundle — no API key needed, ship immediately). Follow with Option 1 after EJScreen key arrives.

**Assigned to**: User (decide whether to apply for EJScreen API key and on what timeline)

---

## PD-003 — Pricing for Pro Tier (Priority: Medium)

**Background**: The current Pro tier is $99/month. The consumer single-report price is $29. No data on conversion rates yet (product is pre-launch). Competitive benchmarks: First Street enterprise pricing is undisclosed but estimated $5,000–$50,000/year for data licenses. EWG is free/donation. ClimateCheck free basic + enterprise.

**Options**:
1. **Keep current pricing** ($29 report, $99/month Pro). Validate with first 50 customers.
2. **Add annual Pro plan** at $79/month billed annually ($948/year). Standard SaaS practice for reducing churn.
3. **Add a Team/Business tier** at $299/month for multi-user access and API access. Would serve real estate teams and environmental consultants.

**Recommendation**: Keep current pricing for launch validation. Add annual plan after first month of data. Add Team tier after 50 Pro subscribers.

**Assigned to**: User (pricing strategy decision)

---

## PD-004 — Water System Risk Atlas (Research Brief #4) (Priority: Medium)

**Background**: The ROADMAP lists "Research Brief #4: Water System Risk Atlas" as in-progress. This would be a nationwide visualization of public water system risk at the PWSID level — a companion to the SCVI and CFCI intelligence pages. Estimated effort: 2–3 days.

**Options**:
1. **Build it now** — UCMR 5 data is fresh (March 2026), SDWIS data is available. The data pipeline for per-PWSID scoring is essentially the water scorer run nationally.
2. **Defer** — Focus engineering cycles on the EJ layer and Superfund static bundle first, which improve per-address accuracy before adding another intelligence page.

**Recommendation**: Option 2 (defer). Fix data accuracy issues (EJ layer, Superfund bundle) before adding new intelligence pages. The Atlas would showcase water data that's already partially visible in individual reports — the marginal value is lower than the foundational fixes.

**Assigned to**: User (priority call)

---

## PD-005 — VOC Coverage Gap (Priority: Low)

**Background**: UCMR 5 covers only PFAS. TCE, PCE, benzene, vinyl chloride — the contaminants at Camp Lejeune, East Palestine, and most legacy industrial sites — are invisible to our scoring. These would require: (a) AQS air quality API for VOC air monitoring, (b) TRI chemical-specific queries filtered to VOCs, or (c) a separate VOC monitoring bundle from EPA's legacy UCMR rounds.

**Options**:
1. **Query EPA UCMR historical data** (rounds 1–4) for VOC detections. Free public download, covers 1999–2022. Would catch many historical contamination sites.
2. **Filter TRI data for VOC emitters** (already available via ECHO). Adds an approximate proxy for VOC air exposure.
3. **Add ATSDR CERCLA health assessment data** as a supplemental source for sites with documented human exposure.

**Recommendation**: Option 1 (historical UCMR bundle) as a quick data accuracy improvement. Option 2 is a near-zero-effort enhancement to existing TRI processing. Option 3 is longer-term research infrastructure.

**Assigned to**: User (authorize scope of VOC work)
