# Claude Code Session — Building Bedrock's Environmental Intelligence Platform

**Product**: Bedrock — address-level environmental exposure scoring for U.S. real estate
**Tool**: Claude Code (Claude Opus 4.7, 1M context)
**Period**: April 17 – June 23, 2026 (multi-session, continuous development)
**Branch**: `claude/bedrock-exposure-platform-QS2yu`
**Scale**: 52 commits, 77 files changed, ~150K lines, 199 TypeScript source files (27K LOC)

---

## What Was Built

A solo founder used Claude Code to build an entire environmental intelligence platform — from scoring engine to data pipelines to D3 visualizations to academic preprints. The system scores any U.S. address across 5 contamination layers (water, air, soil, proximity, environmental justice) using 15 federal data sources, and publishes original national research that no government agency or competitor produces.

### The core product (pre-existing, built with Claude Code in prior sessions)
- **5-layer exposure scoring engine**: Water (25%) | Air (25%) | Proximity (20%) | Soil (15%) | EJ (15%) with proportional re-weighting when data is unavailable
- **15 federal data source integrations**: EPA (UCMR 5, SDWIS, ECHO, FRS/SEMS, Brownfields, TRI), USDA (SSURGO), USGS (WQP), NASA (POWER), FEMA (NFHL), Census (ACS, TIGER)
- **Showcase report**: Scrollytelling layout with sticky score sidebar, per-layer chapters, interactive Mapbox contamination map, AI narrative summaries, PDF export
- **434 passing tests** across 37 test files

### What these sessions added

---

## Session 1: National Soil Contamination Vulnerability Index (SCVI)

**User prompt**: Build a national soil contamination vulnerability index scoring all 3,140 U.S. counties.

**What Claude Code did**:

1. **Designed the SCVI methodology** — a multiplicative index (SCVI = √(SVS × CPI)) that couples intrinsic soil vulnerability (USDA SSURGO data: organic matter, pH, drainage, texture, climate erosivity) with contamination pressure (EPA data: Superfund proximity, industrial facility density, compliance violations, toxic releases). The geometric mean ensures high scores require both factors — vulnerable soil alone doesn't produce a high score.

2. **Built the scoring engine** (`lib/intelligence/scvi-scorer.ts`) — 6-component SVS sub-index + 4-component CPI sub-index, each with threshold-based scoring functions derived from soil science literature. 47 unit tests cover edge cases, interaction effects, and quartile assignment.

3. **Built a resilient batch pipeline** (`scripts/build-scvi-national.ts`) — processes all 3,140 counties with parallel API calls per county, 5-retry exponential backoff, circuit-breaker logic (3 consecutive 503s → 60s pause), checkpoint-resume for crash recovery, and SIGTERM signal handling. Multi-point sampling for large counties (≥1,000 sq mi).

4. **Ran the full national computation** — 3,140 counties scored over ~30 checkpoint commits, merged with Census ACS 2022 demographics (income, poverty, race/ethnicity). Output: `data/scvi-national.json` (1.6MB).

5. **Built the intelligence page** (`/intelligence/soil-crisis`) — D3 choropleth map (Albers projection), SVS-vs-CPI scatter plot, quartile bar charts, 4-chapter scrollytelling research brief, accessibility audited with axe-core.

**Key finding**: Q4 (highest-risk) counties have 2.3× the poverty rate of Q1 counties. Geographic clustering in the Gulf Coast, Mid-Atlantic industrial corridor, Mississippi Delta, and Appalachia. Virginia independent cities dominate the top 20 due to concentrated industrial heritage in small jurisdictions.

---

## Session 2: Compound Flood-Contamination Index (CFCI)

**User prompt**: Build a national flood-contamination compound risk map.

**What Claude Code did**:

Built the CFCI (√(FloodExposure × CPI)) scoring 3,131 counties by fusing FEMA NFIP residential flood zone penetration rates with the CPI contamination layer from SCVI. Neither FEMA nor EPA publishes this intersection — FEMA publishes flood alone, EPA publishes contamination alone.

- Full D3 choropleth with CFCI/Flood/CPI toggle
- FER-vs-CPI scatter plot
- Quartile adaptation-gap and poverty bar charts
- Per-county context panel integrated into individual exposure reports

**Key finding**: 783 Q4 counties (~73M residents) face compound flood-contamination risk. ~1M uninsured SFHA homes sit in Q4 counties.

---

## Session 3: Redlining & Environmental Contamination Analysis

**User prompt**: Link 1930s HOLC redlining maps to present-day contamination data.

**What Claude Code did**:

Built a 300-city analysis joining University of Richmond's HOLC-to-census-tract crosswalk (9,036 neighborhoods) with Census ACS tract-level demographics and county-level SCVI/CFCI/CPI scores.

- D3 bar charts by HOLC grade (A/B/C/D)
- Within-city A-vs-D gap tables for 111 qualifying cities
- HOLC grade context panel integrated into individual reports via `/api/intelligence/holc`

**Key finding**: Grade D (redlined) neighborhoods have 2.3× the poverty rate of Grade A neighborhoods. Pre-1950 housing stock is 2× higher in D-rated areas. Contamination pressure significantly elevated — redlining's 90-year legacy is measurable in environmental data.

---

## Session 4: Satellite Imagery Design System

**User prompt**: Add satellite imagery to the platform.

**What Claude Code did across 8 phases**:

1. Downloaded NASA/Sentinel satellite imagery, optimized to WebP with Sharp, generated LQIP (Low-Quality Image Placeholders) as base64 data URIs
2. Built `DuotoneImage` component with CSS-only filter pipeline: `grayscale(100%) sepia(100%) hue-rotate(115deg) saturate(0.4) brightness(0.65) contrast(1.2)`
3. Built `KenBurnsHero` with CSS animation and `prefers-reduced-motion` gate
4. Rebuilt landing page, intelligence hub, brief pages, and report pages with satellite imagery
5. Fixed a height:0 rendering bug from CSS relative/absolute conflict
6. Ran accessibility audit — 0 serious/critical axe-core violations
7. Replaced hero with recognizable South Florida coastline satellite shot

---

## Session 5: Free Access + QA + Documentation

**User prompt**: Make all features free. Then clean up and write the docs.

**What Claude Code did**:

1. **Removed paywall**: Archived Stripe payment gating to `archive/stripe-payments` branch, made `FreePreviewOverlay` return null, removed `useReportAccess` hook gating
2. **Added Intelligence to navigation**: Link in navbar + buttons on homepage
3. **QA pass**: Fixed 2 lint errors (synchronous setState in useEffect → callback refs), updated 6 stale payment tests, verified build + types + lint + all 434 tests pass
4. **Wrote three documents**:
   - **SCVI academic preprint** (`docs/preprint/scvi-preprint.md`): Full abstract, 5-section paper with methods, results, discussion, limitations. Publication-ready format.
   - **Water System Risk Atlas spec** (`docs/specs/water-risk-atlas.md`): Product spec for Brief #4 — CWRI formula, build pipeline, 4-chapter scrollytelling plan, API design, 8-day effort estimate.
   - **Market Intelligence update** (`docs/MARKET_INTEL.md`): Competitive landscape (First Street, ClimateCheck, EWG, ERIS, Telescope), positioning matrix, scoring limitations, Q3 strategic priorities.

---

## How Claude Code Was Used

### Parallel subagent orchestration
For the three docs, Claude Code spawned 3 research agents in parallel — each independently explored 20-30 files across the codebase to gather methodology details, data statistics, competitive positioning, and architecture patterns. The main agent synthesized findings into coherent documents without duplicating work.

### Full-stack across a single session
Each session touched every layer: TypeScript scoring logic → batch data pipeline scripts → D3 visualization components → Next.js pages → API routes → unit tests → accessibility audits → documentation. No handoffs, no context loss.

### Methodology design
Claude Code didn't just implement specs — it designed the SCVI methodology (multiplicative geometric mean, threshold-based component scoring, coverage tracking), proposed the CFCI compound risk formulation, and structured the redlining analysis pipeline. The founder directed what to build; Claude Code designed how.

### Resilience engineering
The SCVI batch pipeline required processing 3,140 counties against 6 rate-limited federal APIs. Claude Code designed the retry logic, circuit breakers, checkpoint-resume, and signal handling without being asked — recognizing that a multi-hour pipeline hitting government APIs needs production-grade resilience.

---

## The Competitive Moat This Creates

Bedrock is a solo-founder startup that has:
- Scored all 3,140 U.S. counties for soil contamination vulnerability
- Published the only national compound flood-contamination risk map
- Linked 1930s redlining to present-day contamination across 300 cities
- Built a consumer-facing address scoring platform with 15 federal data sources
- Written an academic preprint, a product spec, and competitive analysis

No competitor (First Street, ClimateCheck, EWG, ERIS) produces this combination. The entire Intelligence research series — three national analyses that would typically require a team of data scientists and environmental researchers — was built by one person with Claude Code.

---

## Technical Stack

- Next.js 16.2 + React 19 + TypeScript 5.9
- D3.js + TopoJSON (choropleth maps, scatter plots, bar charts)
- Mapbox GL (interactive contamination maps)
- Supabase (auth + backend)
- Tailwind CSS 4 (design system with CSS variables, dark mode)
- Vitest (434 tests, 37 test files)
- @react-pdf/renderer (PDF export)
- 15 federal API integrations (EPA, USDA, USGS, NASA, FEMA, Census)

**Session URL**: https://claude.ai/code/session_019EG2WmyYUCKCxrzqpyD7bz
