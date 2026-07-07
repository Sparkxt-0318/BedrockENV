# Pending Decisions

Items that require judgment calls on scope, pricing, or product direction. Each entry includes the options considered and a recommendation. Surface to the user at the start of the next session.

---

## 1. Static Superfund NPL Bundle — data prep approach

**Background**: FRS SEMS live API misses known NPL sites (Picher/Tar Creek, Camp Lejeune). A static bundle of ~1,300 active NPL sites with coordinates would fix these false negatives. The bundle is listed as "In Progress" in ROADMAP.md but has never been built.

**Options**:
A. Download EPA's NPL site list from CERCLIS/SEMS bulk download, geocode via site address, bundle as `data/superfund-npl.json`. One-time effort (~1 day).
B. Use EPA's SEMS ACRES API (different endpoint from FRS) which exposes NPL site boundaries as GeoJSON. More accurate for large sites like Tar Creek.
C. Use a third-party geocoded Superfund dataset (e.g., EPA's Envirofacts bulk download).

**Recommendation**: Option A first (fast, reliable), with Option B as a follow-up for large-site boundary accuracy. The FRS SEMS API should remain as a supplemental live lookup; the bundle handles the known gaps.

**Priority**: High — fixes the most embarrassing known scoring error (Picher OK at 18 vs expected 70+).

---

## 2. EJ Layer API Reliability vs. Pre-built Bundle

**Background**: EJScreen's public API runs 5–10s response times. The orchestrator gives it 10s (2.5× SOURCE_TIMEOUT). Consistent timeouts mean the EJ layer silently drops out, redistributing its 15% weight. CDC SVI is similarly slow.

**Options**:
A. Increase timeouts and accept slower assessments when EJ data is needed.
B. Pre-bundle EJScreen block-group data as a static file (similar to nonattainment.json). EPA publishes EJScreen national CSV downloads (~300MB).
C. Move EJ layer to an async "enhancement" that populates post-report via a background job, so the base report loads fast and EJ data fills in.

**Recommendation**: Option B — pre-bundle EJScreen national data. 300MB is large but manageable. Eliminates the API reliability problem entirely. CDC SVI national data (~100MB) can be bundled similarly. Rebuild quarterly.

**Priority**: High — EJ layer currently returns 0 for all addresses, affecting scoring accuracy for every urban/disadvantaged area.

---

## 3. Air API Keys — Self-serve vs. Hardcoded

**Background**: EPA AQS and OpenAQ v3 require API keys. Without them, air layer coverage is ~50%. The keys are user-managed (i.e., the operator of the deployment must register and configure them).

**Options**:
A. Document the required env vars (AQS_API_KEY, OPENAQ_API_KEY) in README and .env.example, accept that deployments without keys get degraded air scores.
B. Obtain keys centrally and store in Vercel/Supabase environment variables for the production deployment.
C. Use only the nonattainment bundle + TRI (already available) for air, and remove the live API calls to eliminate the coverage gap illusion.

**Recommendation**: Option B for production, Option A for self-hosting documentation. The keys are free to register — it's a one-time setup task that unblocks the air layer for all users.

**Priority**: Medium — nonattainment bundle already provides directional accuracy for most addresses.

---

## 4. Large File Refactoring Scope

**Background**: Three UI client components are over 400 lines: RedliningClient.tsx (556), FloodContaminationClient.tsx (491), SoilCrisisClient.tsx (426). ContaminationMap.tsx is 513 lines. The routine's threshold is 400 lines.

**Options**:
A. Refactor each into sub-components immediately. Estimated ~0.5 day per file.
B. Defer refactoring until a feature change requires touching these files (reduce gratuitous churn).
C. Raise the threshold to 600 lines — these files are large D3/Mapbox components that are hard to split without artificial seams.

**Recommendation**: Option B for the intelligence page clients (they're working and rarely touched). Option A for ContaminationMap.tsx if it's getting new features — it's already at 513 lines and actively used. Set a hard limit at 600 lines before mandatory split.

**Priority**: Low — no correctness or performance impact.

---

## 5. Methodology Page — Show SCORING_VERSION Number

**Background**: The methodology page (`app/methodology/page.tsx`) does not display the current SCORING_VERSION (4). The improvement routine requires: "If SCORING_VERSION bumps, methodology page gets an update in the same PR."

**Options**:
A. Add a visible version badge ("Scoring engine v4, updated April 2026") to the methodology page header.
B. Keep it internal-only — users don't need to see version numbers.

**Recommendation**: Option A — version transparency reinforces credibility. Add a small "v4" badge near the title, with a tooltip or footnote explaining what changed. This also makes it easy to verify that the methodology page is in sync with the engine.

**Priority**: Low — cosmetic but reinforces trust.
