# Pending Decisions

Decisions that require user judgment before proceeding. Format: decision, options, recommendation.

---

## 1. EJ Layer Implementation Strategy

**Context**: The EJ layer (15% of composite score) returns 0 for all addresses because EJScreen API access is not configured. This causes composite scores to undercount burden at disadvantaged locations by an estimated 5–20 points (confirmed for South LA, Port Arthur, Flint).

**Options**:
A. Register for EPA EJScreen API credentials and implement live queries. Free; requires EPA registration. Latency ~1–2 seconds per query.
B. Download and bundle the full EJScreen dataset (~3 GB CSV for all census tracts), preprocess to `data/ejscreen-by-tract.json`, and serve from the bundle like UCMR 5. Fast at runtime, no API dependency, but large file.
C. Proxy through CDC SVI only (already coded in `lib/data-sources/cdc-svi.ts`) as a temporary substitute until EJScreen is available. SVI covers social vulnerability but not the environmental burden side of EJ.

**Recommendation**: Option B. Bundling eliminates the API dependency and mirrors the reliable UCMR 5 approach. The tract-level dataset compresses well (~50–100 MB JSON). Build a `scripts/build-ejscreen-data.ts` analogous to the UCMR 5 build script. Expected effort: 1 day.

---

## 2. Superfund Static Bundle vs. FRS API

**Context**: FRS/SEMS radius search misses confirmed active NPL sites (Tar Creek/Picher OK, Camp Lejeune NC). This produces dangerously low scores (18 vs. expected 70+) at some of the most contaminated sites in the US.

**Options**:
A. Build a static `data/superfund-npl.json` bundle from EPA's NPL site list (~1,300 active sites with coordinates and metadata). Supplement live FRS results rather than replace them.
B. Fix the FRS SEMS query parameters to correctly match all NPL sites (requires investigating the program code filter and site registration format).
C. Use the CERCLIS/SEMS downloadable dataset (EPA FTP) as a bundled alternative to the live API.

**Recommendation**: Option A. The NPL list is stable (~1,300 sites, infrequent additions), coordinates are publicly available, and bundling matches Bedrock's existing pattern for UCMR 5 and nonattainment. Option B's root cause is unknown and may not be fixable with parameters alone. Expected effort: 0.5 days.

---

## 3. Air API Key Registration

**Context**: Air layer is at ~50% coverage without EPA AQS and OpenAQ v3 API keys. Nonattainment status and TRI emitter count are available without keys; real-time PM2.5 is not.

**Options**:
A. Register for EPA AQS key (free, requires EPA registration at https://aqs.epa.gov/data/api/signup). Most authoritative US air quality data.
B. Register for OpenAQ v3 key (free, sign up at https://openaq.org). Global coverage, simpler API, data quality varies by country.
C. Integrate AirNow API (free, EPA-managed, designed for real-time consumer applications). Better UX data (hourly AQI) but less historical depth.
D. All three — they serve different use cases (AQS=historical, AirNow=real-time, OpenAQ=supplemental international).

**Recommendation**: Option C (AirNow) first, then Option A (AQS) for historical scoring. AirNow is designed exactly for consumer products and requires only an API key registration. AQS is more complete but has more complex query patterns. Estimated effort: 1 day each.

---

## 4. First Street Competition Response

**Context**: First Street Foundation is the market leader in climate risk for real estate and has instant distribution via Realtor.com (~6M listings). MARKET_INTEL.md notes they are "exploring contamination data layer" per Q1 2026 product blog.

**Options**:
A. Accelerate Bedrock's depth — ship EJ layer, Superfund bundle, Water Risk Atlas, and air keys in Q3. Win on technical completeness before First Street can react.
B. Pursue direct partnership / API licensing with First Street. Bedrock contamination scores + First Street climate scores = a more complete property risk picture.
C. Focus on the distribution gap — build the embeddable widget or MLS API. Bedrock needs a presence on listing pages before First Street expands.
D. Do all three, but prioritize C (distribution) since A (depth) only matters if users can find Bedrock.

**Recommendation**: Option D with C as top priority. Technical completeness (Option A) is table stakes; without distribution (Option C), it doesn't matter. The embeddable widget is the single most impactful unbuilt feature. First Street partnership (Option B) is worth a conversation but is a longer-term play.

---

## 5. Water System Risk Atlas Scope

**Context**: Research Brief #4 is in the roadmap as a PWSID-level assessment of ~50,000 community water systems. The UCMR 5 data is already bundled. SDWIS violations are available.

**Options**:
A. National atlas: Score all ~50,000 CWSs using bundled UCMR 5 + SDWIS violation history + system size/type. Publish at `/intelligence/water-risk-atlas`. Estimated effort: 2 days.
B. Scoped version: Build a searchable lookup table of water systems with PFAS exceedances and violation counts. Simpler, faster to ship, less narrative depth.
C. Integrate into individual reports: Rather than a standalone page, add a "Your water system compared to national distribution" stat to the water layer chapter. Shows where the user's system ranks among all CWSs.

**Recommendation**: Option A. A national atlas follows the established SCVI/CFCI pattern that has been well received. The data is already available (UCMR 5 bundled, SDWIS via API). A dedicated Intelligence page has more research/editorial credibility than embedded stats. Option C is complementary and could be added as a component in the same PR.

---

## 6. Batch Assessment for Pro Users

**Context**: Real estate professionals managing multiple properties need to run assessments at scale. ClimateCheck already offers portfolio-level batch scoring.

**Options**:
A. CSV upload: User uploads a file with addresses, Bedrock queues assessments and emails results. Requires a job queue (Vercel cron or similar).
B. API endpoint: `POST /api/batch-assessment` with an array of addresses. Synchronous for small batches (<10), async with a job ID for larger ones.
C. Spreadsheet integration: Google Sheets add-on or Excel export/import. Higher effort, higher user adoption for real estate agents.

**Recommendation**: Option B. An API endpoint is the foundation for both C (Google Sheets can call REST) and for potential MLS/PropTech integrations. Start with a simple synchronous batch endpoint (up to 10 addresses) gated behind Pro tier. Expected effort: 1 day.
