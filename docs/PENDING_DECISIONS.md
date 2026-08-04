# Pending Decisions

Items that require a judgment call (pricing, branding, scope, or external access) and need input from the user.

---

## 1. Superfund Static Bundle

**Context**: FRS SEMS radius search misses some active NPL Superfund sites (confirmed: Tar Creek/Picher OK, Camp Lejeune NC). A static bundle of ~1,300 active NPL sites with centroid coordinates would fix these false negatives and make proximity scoring more reliable.

**Effort**: ~0.5 days. NPL site list is publicly available from EPA (SEMS National NPL Site data download). Script would geocode centroids and build a JSON bundle similar to `data/nonattainment.json`.

**Options**:
- A. Build the static bundle — eliminates FRS SEMS dependency for NPL sites; bundle updated quarterly
- B. Fix FRS SEMS query — investigate why radius search misses some NPL sites (polygon vs. point registration issue)
- C. Both — static bundle as fallback when FRS returns 0 results

**Recommendation**: Option A (static bundle). Building against the API is unreliable given the documented miss rate. The NPL site list is stable (~1,300 sites; few additions/removals per year). Bundle approach is proven (nonattainment.json works well).

**Added**: 2026-08-04

---

## 2. EJ Layer API Credentials

**Context**: The EJ layer (EJScreen + CDC SVI) returns 0 for all addresses, causing South LA, Port Arthur TX, Flint MI, and other high-burden areas to under-score by 15–25 points. Implementing EJ is the highest-priority scoring improvement.

**Effort**: EJScreen API is free but requires registration at https://ejscreen.epa.gov/mapper/ejscreen_api_help.html. CDC SVI data is publicly available without credentials.

**Options**:
- A. Register for EJScreen API and configure `EJSCREEN_API_KEY` environment variable
- B. Download EJScreen census-tract data as a static bundle (similar to nonattainment.json approach) — no API key needed, but larger file
- C. Use CDC SVI alone (available without credentials) as a partial EJ signal

**Recommendation**: Option B (static EJScreen bundle) for reliability — avoids API key management and rate limits. EJScreen publishes annual tract-level CSV downloads. A one-time data prep script would build a FIPS → percentile lookup. Estimated 1 day.

**Added**: 2026-08-04

---

## 3. Air API Keys

**Context**: Without EPA AQS and OpenAQ API keys, the air layer operates at ~50% coverage (nonattainment bundle only). Full air scoring requires:
- EPA AQS API key (free, requires registration at https://aqs.epa.gov/aqsweb/documents/AQS_API.html)
- OpenAQ v3 API key (free tier available, higher limits with registration)
- AirNow API key (free, https://docs.airnowapi.org/account/request)

**Recommendation**: Register for all three — all are free, each requires only an email address and use-case description. Configure as environment variables: `AQS_EMAIL`, `AQS_KEY`, `OPENAQ_KEY`, `AIRNOW_KEY`.

**Added**: 2026-08-04
