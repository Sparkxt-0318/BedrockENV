# Pending Decisions

Items that require a judgment call on pricing, branding, scope, or external credentials. Each entry includes options and a recommendation.

---

## PD-001: EJ Layer API Credentials
**Date raised**: 2026-04-16  
**Urgency**: High — EJ returns 0 for every address until resolved.

**Context**: The environmental justice layer (EJScreen + CDC SVI) currently returns 0 for all addresses because no external API credentials are configured. EJ carries a 15% weight in the composite score. For high-burden addresses (South LA, Port Arthur, Flint), expected score increases of 5–15 points when live.

**Options**:
1. Register for EPA EJScreen API key — free, government program, 1–3 day turnaround.
2. Bundle EJScreen data statically (county-level) as a JSON file, similar to nonattainment bundle — no credentials, but county-level resolution only.
3. Use CDC SVI (Social Vulnerability Index) as a proxy — also free, county-level, already published as CSV.

**Recommendation**: Do Option 2 (static EJScreen county bundle) immediately to unblock the 15% score gap. Option 1 can follow for tract-level resolution.

---

## PD-002: Air Layer API Credentials
**Date raised**: 2026-04-16  
**Urgency**: Medium — air layer at ~50% coverage without keys.

**Context**: Full air scoring requires EPA AQS API key and/or OpenAQ v3 API key. Without them, air scoring relies only on TRI emitters (ECHO) and nonattainment status (bundled). PM2.5 readings and ozone measurements are not available.

**Options**:
1. Register for EPA AQS API key — free, government program, same-day self-service.
2. Register for OpenAQ v3 — free tier, open-source platform.
3. Accept current 50% coverage as sufficient for MVP.

**Recommendation**: Option 1 (EPA AQS) has the most coverage depth. Register at api.epa.gov/aqs.

---

## PD-003: Superfund Static Bundle
**Date raised**: 2026-04-16  
**Urgency**: High — FRS SEMS radius search silently misses some active NPL sites (Picher, Camp Lejeune confirmed gaps).

**Context**: The live FRS SEMS API radius search fails to return some active NPL Superfund sites. A static bundle of ~1,300 active NPL sites with centroid coordinates would guarantee coverage regardless of FRS API behavior. This is an "in-progress" ROADMAP item.

**Options**:
1. Download EPA's CERCLIS NPL list as CSV, geocode, bundle as JSON (similar to nonattainment.json approach).
2. Continue relying on FRS API + accept gap.

**Recommendation**: Option 1. EPA publishes the full NPL list at https://www.epa.gov/superfund/superfund-national-priorities-list-npl. The build script would be similar to build-ucmr5-data.ts. Estimated effort: 0.5 days.

---

## PD-004: UCMR5 Bundle Refresh
**Date raised**: 2026-06-18  
**Urgency**: Medium — current bundle is from EPA's February 2026 release; a Q2 2026 release may be available.

**Context**: The current `ucmr5-by-pwsid.json` was generated on 2026-04-13 from EPA's UCMR 5 release dated 2026-02-12. EPA publishes UCMR 5 data quarterly. A Q2 2026 release (covering reporting through March/April 2026) may now be available at https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule.

**Options**:
1. Check EPA's UCMR page quarterly and rebuild when a new release appears.
2. Add a build step that checks the EPA page's "last modified" date and alerts when it changes.

**Recommendation**: Check manually now (user action required — needs EPA website access). Then set a reminder to check quarterly. Option 2 is a nice-to-have automation.

---

## PD-005: Distribution — Embeddable Widget or API
**Date raised**: 2026-06-18  
**Urgency**: Low — growth channel consideration.

**Context**: First Street Foundation has achieved broad distribution by embedding into Realtor.com and Redfin via an API partnership. Bedrock's unique contamination + EJ data fills a gap none of those integrations cover. A lightweight embeddable widget (e.g., `<bedrock-score address="...">`) or a `GET /api/score?address=...` endpoint with a generous free tier could accelerate distribution.

**Options**:
1. Build an embeddable score widget (Web Component or React embed) and self-host.
2. Publish a public API with rate limiting and API keys.
3. Pursue direct partnership with Realtor.com / Redfin.

**Recommendation**: Option 2 (public API) is the fastest to ship and creates the most downstream distribution opportunities. Keep the free tier meaningful (e.g., 100 requests/month) to drive adoption.

---

## PD-006: Batch / Portfolio Assessment for Pro Users
**Date raised**: 2026-06-18  
**Urgency**: Low — competitive parity with ClimateCheck.

**Context**: ClimateCheck offers portfolio-level analysis (CSV upload, batch scoring). Bedrock Pro users managing multiple properties (agents, inspectors, investors) have no batch flow — they must run each address individually.

**Options**:
1. CSV upload endpoint: accept a CSV of addresses, queue batch assessments, email results as PDF bundle.
2. API endpoint for batch: `POST /api/batch-assess` with array of addresses.
3. In-app portfolio dashboard (more complex, full UI).

**Recommendation**: Option 1 (CSV upload) is fastest. Target Pro users. Estimated effort: 1.5 days for backend + basic UI.

---

## PD-007: Historical Contamination Flag for Abandoned Sites
**Date raised**: 2026-04-16  
**Urgency**: Low — edge case but visible in demos (Picher, OK scores 18 vs expected 70+).

**Context**: Picher, OK (Tar Creek Superfund — one of the worst in US history) scores only 18 because: the town was dissolved in 2009 (no PWSID), no active monitoring infrastructure, FRS SEMS misses the NPL site, and no AQS station within range. The scoring system has no mechanism to flag known historical contamination that predates current monitoring systems.

**Options**:
1. Maintain a hand-curated "known events" supplemental JSON (address → known contamination description + severity).
2. Build a keyword lookup against historical Superfund records.
3. Accept as a known limitation and document it.

**Recommendation**: Option 1 for a small set of iconic sites (Picher, Love Canal, Times Beach). Option 3 as the documented baseline. Not worth building Option 2 until NPL static bundle (PD-003) is complete.
