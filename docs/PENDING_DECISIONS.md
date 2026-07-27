# Pending Decisions

Items requiring a judgment call on pricing, branding, or scope. Each entry includes context, options, and a recommendation. Reviewed with the user at the next available session.

---

## PD-001: EJ Layer vs. Superfund Static Bundle — Which to ship first?

**Context**: Both are "In Progress" and listed as Q3 2026 must-dos in MARKET_INTEL.md. The EJ layer currently returns 0 for all addresses (requires EJScreen + CDC SVI API keys and integration work). The Superfund static bundle (~1,300 NPL sites with coordinates) would fix the FRS SEMS gap for sites like Picher, Tar Creek, Camp Lejeune — estimated effort 0.5 days.

**Options**:
- A) Ship Superfund bundle first (0.5d effort, fixes known score gaps for ~20 documented contamination hotspots, immediate score accuracy improvement)
- B) Ship EJ layer first (3-4d effort including API key provisioning, fills 15% weight currently absent from all scores, largest single improvement to composite accuracy)
- C) Parallel (split effort — proceed on both simultaneously)

**Recommendation**: Ship the Superfund static bundle first (A). It is faster, has no external dependencies (no API keys needed), directly addresses documented ground-truth failures for the most publicized contamination sites, and builds trust. Then pivot immediately to EJ layer.

**Opened**: 2026-07-27

---

## PD-002: Air API Keys — AQS vs. OpenAQ vs. AirNow

**Context**: Air layer is at ~50% coverage without API keys. Three options exist for live PM2.5/ozone data. The data source already has adapters for EPA AQS and OpenAQ v3; AirNow requires different integration.

**Options**:
- A) EPA AQS only — free, authoritative, but registration required; hourly data, US-only
- B) OpenAQ v3 — free tier (5,000 requests/month), global, near-real-time
- C) Both AQS + OpenAQ (AQS for US, OpenAQ as fallback for gaps) — already the implemented fallback pattern

**Recommendation**: Register for both EPA AQS and OpenAQ v3 (C). Adapters already exist. Combined coverage fills the ~50% gap. Registration is free. Priority: AQS first as it's the authoritative federal source.

**Action required from user**: Register at https://aqs.epa.gov/aqsweb/documents/data_api.html (AQS) and https://openaq.org (OpenAQ). Add keys as AQS_API_KEY and OPENAQ_API_KEY env vars.

**Opened**: 2026-07-27

---

## PD-003: API/Batch Product Pricing for Pro Tier

**Context**: MARKET_INTEL.md identifies embeddable widget/API and batch assessment for Pro as Q3 2026 should-dos. No pricing has been set. First Street's enterprise API is undisclosed; ERIS charges per-report.

**Options**:
- A) Flat monthly: $199/mo for 100 batch assessments, $499/mo for 500, enterprise custom
- B) Per-call: $0.99 per assessment above the Pro ($99/mo) base of 50 reports/month
- C) Defer pricing until first enterprise inquiry arrives; ship the technical capability first

**Recommendation**: C — ship the technical batch endpoint first, gate it on Pro subscription, and set pricing when the first real customer asks. Premature pricing locks in positioning before we know what the market will pay.

**Opened**: 2026-07-27

---

## PD-004: Refactor Large UI Files (>400 lines)

**Context**: The routine requires refactoring any file over 400 lines. The following non-script, non-test production files exceed the threshold:

| File | Lines |
|---|---|
| `app/intelligence/redlining/RedliningClient.tsx` | 556 |
| `components/report/ContaminationMap.tsx` | 513 |
| `app/intelligence/flood-contamination/FloodContaminationClient.tsx` | 491 |
| `lib/data-sources/usda-ssurgo.ts` | 436 |
| `types/exposure.ts` | 426 |
| `app/intelligence/soil-crisis/SoilCrisisClient.tsx` | 426 |

**Options**:
- A) Refactor all 6 immediately (3-4d effort, risk of regressions in complex D3 scrollytelling components)
- B) Refactor only `lib/data-sources/usda-ssurgo.ts` (clearest seam — SSURGO fetch vs. scoring logic), defer UI components
- C) Accept current sizes given the scrollytelling components are inherently large; focus refactors on lib/ only

**Recommendation**: C with targeted action on lib/. The intelligence client components are scrollytelling pages — their length is structural, not accidental. Splitting them would create more complexity, not less. Refactor `lib/data-sources/usda-ssurgo.ts` (436 → ~200+200 by separating fetch and parse), and leave the scrollytelling clients alone.

**Opened**: 2026-07-27
