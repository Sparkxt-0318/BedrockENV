# Bedrock ENV — Roadmap

## Shipped

- **Composite scoring engine** (v4) — 5-layer weighted model (water 25%, air 25%, proximity 20%, soil 15%, EJ 15%) with proportional re-weighting when layers are unavailable
- **Water layer** — UCMR 5 PFAS (bundled), SDWIS violations, WQP detections, Census lead-risk proxy (ACS B25034)
- **Air layer** — OpenAQ/AQS PM2.5 (requires API key), TRI air emitters (ECHO), nonattainment status (bundled Green Book)
- **Proximity layer** — Superfund NPL sites (FRS/SEMS), ECHO regulated facilities, significant non-compliance
- **Soil layer** — SSURGO (USDA), brownfields (EPA), FEMA flood zones (NFHL), NASA POWER climate data
- **Coverage honesty** — Distinguishes "clean data" from "no monitoring infrastructure" via presence factor (present/partial/unmapped)
- **Design system** — Instrument Serif / Inter Tight / JetBrains Mono, CSS variable palette, dark mode, pure CSS animation with reduced-motion gate
- **Showcase report** — Scrollytelling layout with sticky score sidebar, per-layer chapters, animated Score rings, coverage meters, source citations
- **Landing page** — Editorial design with 5 layer chapters, CountUp hero stats, embedded address input
- **Recommendations engine** — Deterministic template-based recommendations triggered by data thresholds (not AI-generated)
- **Geocoding** — Census + Mapbox fallback, PWSID resolution via SDWIS
- **Auth + billing** — Supabase auth, Stripe checkout, Pro tier gating
- **Accessibility** — axe-core audited, ARIA meters, semantic HTML, keyboard accessible
- **PDF report export** — @react-pdf/renderer multi-page PDF with cover, layers, recommendations, methodology
- **Stripe payments** — $29 consumer report purchase, $99/mo Pro subscription, free preview with frosted blur overlay
- **Mapbox layer visualization** — Interactive map in showcase report showing property marker, Superfund NPL sites, ECHO/TRI regulated facilities, brownfield sites, flood zones, water system markers with toggleable layers and legend
- **SCVI national map** — Soil Contamination Vulnerability Index scoring all 3,140 US counties (√(SVS × CPI) normalized 0–100), `/intelligence/soil-crisis` page with D3 choropleth, SVS-vs-CPI scatter plot, quartile bar charts, 4-chapter scrollytelling research brief, Census ACS demographics overlay, axe-core accessibility audited
- **CFCI national map** — Compound Flood-Contamination Index scoring 3,131 US counties (√(FloodExposureScore × CPI) normalized 0–100), fused from FEMA NFIP residential SFHA penetration rates and the SCVI contamination-pressure layer. `/intelligence/flood-contamination` page with D3 choropleth (CFCI / Flood / CPI toggle), FER-vs-CPI scatter, quartile adaptation-gap and poverty bars, 4-chapter scrollytelling brief, and per-county context panel in the soil chapter of individual reports. Identifies ~783 Q4 counties (~73M residents) where flood exposure and contamination compound.
- **Redlining & Environmental Contamination** — 300-city analysis linking 1930s HOLC redlining maps to present-day demographics and environmental indicators. Data pipeline joins University of Richmond HOLC-to-census-tract crosswalk (9,036 neighborhoods) with Census ACS tract-level demographics (income, poverty, race, pre-1950 housing) and county-level SCVI/CFCI/CPI scores. `/intelligence/redlining` page with 4-chapter scrollytelling (HOLC history, economic gradients, built-environment legacy, compounding burden), D3 bar charts by HOLC grade, within-city A-vs-D gap tables for 111 qualifying cities. HOLC grade context panel integrated into EJ layer of individual reports via `/api/intelligence/holc` endpoint.

## In Progress

- **EJ layer** — EJScreen + CDC SVI integration (requires external API access; EJ scores return 0* for all addresses currently)
- **Air API keys** — EPA AQS, OpenAQ v3, AirNow registration (user-managed; air layer at ~50% coverage without them)
- **Superfund static bundle** — ~1,300 active NPL sites with coordinates to supplement FRS SEMS API (addresses Picher/Tar Creek gap)
- **Rank-order calibration** — Integration tests for relative scoring (Newark vs Flint, South LA vs Flint) need tuning after EJ layer is live
- **Neighborhood comparison** — Compare composite scores across surrounding census tracts to contextualize a single address (spec below)
- **Research Brief #4: Water System Risk Atlas** — Nationwide assessment of public water system risk factors including PFAS detection patterns, violation history, and infrastructure-age proxies at the PWSID level

## Considering

- **Historical contamination flag** — Special handling for abandoned/dissolved towns (Picher-class) where contamination predates monitoring infrastructure
- **RSEI cancer risk** — EPA Risk-Screening Environmental Indicators for air toxics cancer risk (would improve Port Arthur scoring)
- **CERCLIS/SEMS supplemental source** — Additional Superfund data beyond FRS facility records
- **Time-series trends** — Show how contamination levels have changed over time (SDWIS violation history, air quality trends)
- **Mobile app** — React Native wrapper for push notifications on data updates

---

## Spec: Neighborhood Comparison (In-Progress)

### What it does
When a user views a report for an address, a "Neighborhood Context" section shows
how the composite score compares to the surrounding census tracts. Displays a
horizontal bar chart of 5-8 nearby tracts with the target address highlighted.

### Data sources
- **Census TIGER API** — Given a census tract FIPS code, fetch adjacent tracts
  using the TIGER geographic relationship API (`/geo/tract-adjacency`)
- **Cached assessments** — For each adjacent tract, check if we already have a
  scored assessment in `exposure_assessments` for any address in that tract
- **Lightweight proxy assessment** — For uncached tracts, run a centroid-based
  assessment using the tract centroid coordinates (skip WQP, use only bundled
  data + ECHO radius). This is a "directional" estimate, not a full assessment.

### UI component
- `NeighborhoodComparison.tsx` — horizontal bar chart with tract labels
- Shows composite score for each tract as a colored bar (green/amber/red)
- Target address highlighted with accent outline
- "Your address" label pinned to the target bar
- Expand/collapse toggle, collapsed by default on mobile
- Placed after DataCoverageBreakdown in the showcase report

### API changes
- `GET /api/neighborhood-comparison?tract=FIPS&lat=N&lng=N` — returns adjacent
  tract composite scores (cached or estimated)
- Rate limited: 1 request per assessment (cached after first call)

### Tests needed
- Unit: NeighborhoodComparison component renders with mock data
- Unit: adjacent tract centroid calculation
- Unit: proxy assessment score estimation
- Integration: API returns valid comparison data for a known tract

### Estimated effort
- 1 day: API route + Census TIGER integration + proxy scoring
- 0.5 day: UI component + showcase integration
- 0.5 day: tests + polish
