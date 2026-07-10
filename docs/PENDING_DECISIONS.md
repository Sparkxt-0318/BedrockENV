# Pending Decisions

Items requiring judgment calls on pricing, branding, scope, or architecture. Each entry includes options and a recommendation. Surface these to the user at the next session.

---

## 1. EJ Layer API Strategy

**Date identified**: 2026-07-10
**Context**: The EJ layer (15% of composite score) currently returns 0 for all addresses. Two federal data sources would fix this: EJScreen (EPA) and CDC Social Vulnerability Index (SVI). Both APIs require either direct API keys or accepting rate limits.

**Options**:
A. **EJScreen API** (EPA) — free, no key required for standard queries, but rate-limited and known to be slow. Covers cumulative environmental burden, demographic indices, and P2 indicators.
B. **CDC SVI API** — free, no key required. Covers social vulnerability (poverty, minority status, housing, transportation). Less environmental, more socioeconomic.
C. **Bundle both as static JSON** — download county/tract-level EJScreen and SVI data, bundle as JSON files (similar to nonattainment and UCMR 5 bundles). No API dependency, no rate limits, but data freshness tied to manual refresh.
D. **Commission EJScreen data partnership** — reach out to EPA for higher-rate API access or bulk data transfer. Appropriate if Bedrock reaches significant user volume.

**Recommendation**: Option C (static bundle) for the MVP EJ layer. EJScreen publishes census-tract-level data annually; a tract-level JSON bundle (~300MB compressed) eliminates API reliability issues and matches our existing pattern for nonattainment and UCMR 5. Switch to live API queries once the EJ layer is validated.

**Blocker**: None — this is a data prep task, not an engineering constraint.

---

## 2. Embeddable Widget / API Distribution

**Date identified**: 2026-07-10
**Context**: First Street's Realtor.com integration is the primary competitive moat we don't have. An embeddable "Bedrock Score" badge on listing pages could drive traffic and create distribution.

**Options**:
A. **JavaScript snippet** — `<script>` tag that renders a score badge inline on any page. Requires hosting a lightweight iframe or custom element. Low friction for partners.
B. **REST API** — `GET /api/score?address=...` returns JSON. Requires partners to integrate on their backend. Higher friction but more flexible.
C. **OpenGraph meta tags** — Auto-generate OG preview images with the score for social sharing. Zero integration friction; doesn't create a distribution relationship.
D. **Partnership with PropStream, Redfin, or similar** — Direct enterprise data licensing. Requires sales effort but gets us into the search flow.

**Recommendation**: Start with Option B (REST API) behind an API key. It's the minimum viable distribution play with the least UX surface area to maintain. Document it and wait for an inbound partner inquiry before building the JS widget (Option A).

**Blocker**: API rate limiting strategy for unauthenticated vs. partner key access needs to be designed before launch.

---

## 3. Superfund Static Bundle vs. FRS API

**Date identified**: 2026-07-10  
**Context**: FRS SEMS API misses several high-profile NPL Superfund sites (Tar Creek/Picher OK, Camp Lejeune NC). A static bundle of ~1,300 active NPL sites with coordinates would be more reliable. This is listed as "in-progress" in ROADMAP.md but has not been built.

**Options**:
A. **Static bundle from EPA's NPL data** — Download `superfund_sites.json` from EPA's CERCLIS data portal, filter for NPL-active sites, add lat/lng from geocoding. Bundle as `data/superfund-npl.json`. One-time effort, refresh annually.
B. **Continue relying on FRS SEMS API** — Status quo. Misses some sites but covers the majority. No additional maintenance burden.
C. **Hybrid** — Static bundle as primary lookup, FRS API as supplemental for sites added after the bundle's refresh date.

**Recommendation**: Option A (static bundle). The FRS SEMS gap is a known false-negative issue for some of the most famous contamination sites in the US. Building a static bundle eliminates the gap entirely. Estimated effort: 0.5 days of data prep + 0.5 days of integration + tests.

**Blocker**: None. EPA publishes the NPL site list at https://www.epa.gov/superfund/superfund-data-and-reports.
