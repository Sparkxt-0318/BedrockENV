# Pending Decisions

Items that require a judgment call from the user before proceeding.

---

## 1. EJ Layer Data Strategy

**Status**: Blocked on data access
**Priority**: High — biggest scoring gap in the system

**Problem**: The EJ layer returns 0 for all addresses because EJScreen and CDC SVI require
external API access or a bulk data download (~2 GB). Without it, urban/disadvantaged areas
under-score by 15–25 points vs ground truth.

**Options**:

A. **EJScreen API key** — Register at https://ejscreen.epa.gov/mapper/. Free but requires
   manual registration. Provides real-time data at block-group level. Adds one more API dependency.

B. **CDC SVI static bundle** — Download and pre-process the CDC Social Vulnerability Index
   (county-level: 5 MB; tract-level: ~50 MB). No API key required, bundled like nonattainment.
   Less granular than EJScreen but no runtime dependency. Refresh annually.

C. **Hybrid: CDC SVI bundle + EJScreen API** — Use SVI as a reliable floor, supplement with
   EJScreen if API key is available. Graceful degradation.

**Recommendation**: Option B (CDC SVI static bundle) as immediate unblocking step. ~0.5 days
of data processing work. Option C is the long-term goal but doesn't block shipping.

---

## 2. Superfund Static Bundle vs API-Only

**Status**: Decision required
**Priority**: High — known false negatives for major NPL sites (Picher/Tar Creek, Camp Lejeune)

**Problem**: FRS SEMS API radius search misses some large Superfund sites because they are
registered as area-based rather than point-based facilities.

**Options**:

A. **Static NPL bundle** — Download all ~1,300 active NPL sites from EPA's SEMS annual export
   (available as CSV/GeoJSON). Geocode centroids, bundle as `data/superfund-npl.json`.
   No API dependency, 100% coverage of active NPL sites. Refresh annually. ~0.5 days.

B. **CERCLIS/GeoServer alternative** — Try EPA's GeoServer WFS endpoint for Superfund sites
   instead of FRS SEMS. May return more complete spatial data. Risk: same underlying data.

C. **Both** — Keep FRS SEMS for real-time data, supplement with static bundle to fill gaps.

**Recommendation**: Option A. The static bundle is the reliable fix. SEMS can stay as a
supplemental check. The NPL sites don't change frequently — annual refresh is fine.

---

## 3. Air API Keys

**Status**: Pending user action
**Priority**: Medium — air layer at ~50% coverage without them

**What's needed**:
- **EPA AQS** (Air Quality System): Free registration at https://aqs.epa.gov/aqsweb/documents/data_api.html
- **OpenAQ v3**: Free API key at https://openaq.org/developers/
- **AirNow**: Free registration at https://docs.airnowapi.org/

**Impact**: Without PM2.5 data, the air layer only scores from nonattainment status and TRI
emitter counts. Rural areas with no nonattainment designation but real pollution get air=0.

**Recommendation**: Register for all three — all are free. OpenAQ is highest priority because
it covers the most addresses and requires the simplest integration.

---

## 4. Embeddable Widget / API Distribution

**Status**: Considering — scoped for prioritization decision
**Priority**: Medium

**Problem**: Bedrock has no distribution channel beyond direct web visits. First Street
reaches millions via Realtor.com integration. Without a way to embed Bedrock scores in
listing pages or home inspection reports, growth is limited.

**Options**:

A. **JavaScript embed widget** — `<script>` tag that renders a "Bedrock Score" badge
   for an address. Realtors and MLS platforms could embed it on listing pages.
   ~2 days. Requires rate limiting by embed domain.

B. **REST API** — JSON endpoint returning composite score + sub-scores for an address.
   Target: environmental consultants, home inspection software, MLS data feeds.
   ~1 day. Requires API key system (Stripe-compatible).

C. **Zillow/Redfin plugin** — Build to their embed specs. More distribution but
   platform risk and slower to ship.

**Recommendation**: Option B (REST API). Lowest friction, enables third-party integration,
and aligns with the professional/consultant market. Widget (A) is next.

---

## 5. Pricing / Business Model

**Status**: Current state: everything free
**Priority**: User decision

**Current state**: All features are free. Stripe infrastructure exists but gating was removed.

**Question**: Is the free-for-all approach intentional (growth/distribution strategy) or
temporary (while developing the product)?

**Options**:

A. **Keep free** — Build traffic and credibility, monetize later via API/B2B.
B. **Re-enable consumer pricing** — $29/report, $99/mo Pro (Stripe already wired).
C. **B2B only** — Free for consumers, paid API for real estate agents and platforms.

**Recommendation**: Keep free for consumers through Q3 2026 to build credibility.
Re-enable API pricing (Option C) once the REST API is shipped. Avoids the awkward
position of charging consumers before the product is fully reliable.
