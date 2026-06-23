# Market Intelligence — Environmental Exposure Platforms (June 2026)

## Competitor Landscape

### First Street Foundation (Risk Factor)
- **Position**: Market leader in climate risk scoring for real estate
- **Model**: Property-level 1-10 scores for flood, wildfire, wind, heat, air
- **Distribution**: Integrated into Realtor.com, Redfin via RPR (Realtors Property Resource)
- **Updates**: Quarterly data updates, annual model refreshes
- **API**: Enterprise pricing, portfolio-level aggregation
- **Recent**: Added annual flood damage estimates for residential properties. Exploring contamination data layer (per Q1 2026 product blog) but no public release yet.

**Bedrock differentiation**: First Street focuses on *climate* risk (future projections).
Bedrock focuses on *contamination* risk (current exposure from water, soil, air, proximity).
Complementary, not competitive. First Street does NOT cover PFAS, lead, Superfund,
brownfields, SDWIS violations, or environmental justice. Their "air" peril is wildfire
smoke, not industrial pollution or nonattainment. If they add contamination, they have
instant distribution via Realtor.com — this is Bedrock's primary competitive threat.

### ClimateCheck
- **Position**: Climate risk scoring with 2060 projection capability
- **Model**: 1-100 scores for heat, precipitation, wildfire, drought, wind, flood
- **Target**: Enterprise — equity investors, environmental consultants, listing portals
- **Pricing**: Free basic report, enterprise tiers undisclosed
- **Recent**: 5-year increment projections through 2060; added portfolio-level batch scoring

**Bedrock differentiation**: Same as First Street — ClimateCheck is climate-forward
(temperature, precipitation, wildfire), not contamination-focused. No water quality,
no Superfund proximity, no SDWIS data, no PFAS.

### EWG (Environmental Working Group)
- **Position**: Consumer advocacy + PFAS contamination mapping
- **Product**: Interactive PFAS map (9,728+ sites), Tap Water Database, Dirty Dozen list
- **Data**: UCMR 5 (EPA 11th round released March 2026), state databases, academic studies
- **Recent 2026**: Published PFAS pesticide guide (March 2026), updated PFAS in wildlife map, expanded Tap Water Database to include UCMR 5 results
- **Model**: Free, donation-supported nonprofit

**Bedrock differentiation**: EWG maps contamination *sites* but does not score
*addresses*. No composite scoring, no per-address assessment, no report generation.
EWG is a lookup tool ("is there PFAS near me?"), not an assessment platform. We use
the same UCMR 5 data but wrap it in a multi-layer scoring model with confidence
tracking and coverage honesty. EWG's Tap Water Database now includes UCMR 5
results — the same raw data Bedrock bundles — but presents it as a lookup, not a
risk score.

### ERIS (Environmental Risk Information Services)
- **Position**: Phase I environmental site assessment data provider
- **Target**: Environmental consultants, commercial real estate due diligence
- **Data**: Government databases (Superfund, RCRA, LUST, brownfields) + proprietary
- **Pricing**: Per-report, enterprise licensing
- **Model**: Data aggregation, not scoring

**Bedrock differentiation**: ERIS serves environmental consultants doing Phase I ESAs
(regulatory compliance). Bedrock serves consumers and real estate agents who need a
quick score, not a 200-page regulatory report. Different market, different UX.

### Telescope (Norway, founded 2022)
- **Position**: Fast property-level environmental risk for real estate
- **Coverage**: Europe-focused (Norway origin), expanding to UK and select US metros
- **Features**: Wildfire, flooding, soil contamination, biodiversity
- **Model**: Address-based instant assessment
- **Recent**: UK market launch Q1 2026

**Bedrock differentiation**: Telescope is the closest competitor in UX intent (enter
address, get instant assessment). However: (1) US-focused data sources give us depth
they can't match (UCMR 5, SDWIS, ECHO, FRS, EJScreen are US-only federal datasets),
(2) they focus on climate + biodiversity, we focus on contamination + environmental
justice, (3) their US coverage is limited to a handful of metros.

---

## Bedrock's Current Position (June 2026)

### What's shipped

**Composite Scoring Engine (v4):**
5-layer weighted model — Water (25%) | Air (25%) | Proximity (20%) | Soil (15%) | EJ (15%). Proportional re-weighting when layers unavailable. Coverage honesty badges distinguish "clean data" from "no monitoring infrastructure."

**15 Federal Data Sources Integrated:**
EPA (UCMR 5, SDWIS, ECHO, FRS/SEMS, Brownfields, TRI, Green Book), USDA (SSURGO), USGS (WQP), NASA (POWER), FEMA (NFHL/NFIP), Census Bureau (ACS, TIGER), University of Richmond (HOLC maps)

**Three Intelligence Research Briefs Published:**
1. **America's Invisible Soil Crisis** — SCVI for 3,140 counties. First national county-level soil contamination vulnerability assessment.
2. **Flood Meets Contamination** — CFCI identifying 783 counties (~73M residents) where flood and contamination compound. Neither FEMA nor EPA publishes this intersection.
3. **Drawn in Red, Measured Today** — 300-city analysis linking 1930s HOLC redlining to present-day contamination. 9,036 neighborhoods analyzed.

**Report Features:**
- Scrollytelling showcase layout with per-layer chapters
- Interactive Mapbox contamination map (Superfund, ECHO/TRI, brownfields, flood zones)
- AI-generated narrative summaries (per report)
- Deterministic recommendation engine (expert-sourced decision trees, not AI-generated)
- PDF export via @react-pdf/renderer
- Resolution transparency — every data point tagged with spatial resolution
- Source attribution — every claim traced to a federal dataset

**Access Model:**
All features free. No paywall. (Stripe infrastructure retained but gating removed.)

### What's in progress

- **EJ layer**: EJScreen + CDC SVI integration (currently returns 0 for all addresses)
- **Air API keys**: EPA AQS, OpenAQ v3, AirNow (air layer at ~50% coverage without them)
- **Superfund static bundle**: ~1,300 NPL sites with coordinates (addresses FRS API gaps)
- **Research Brief #4: Water System Risk Atlas**: PWSID-level assessment of ~50,000 community water systems

### Known scoring limitations

| Address | Current score | Expected (full data) | Gap reason |
|---------|--------------|---------------------|------------|
| Port Arthur, TX | 58 | 65+ | EJ layer unavailable |
| Newark, NJ | 29 | 56 | API outages during scoring |
| South LA (90002) | 27 | 65+ | EJ layer unavailable + API issues |
| Flint, MI | 31 | 55+ | SDWIS violations aged off + EJ layer |
| Miami Beach, FL | 43 | 43 | Correct (PFAS captured) |
| Picher, OK | 18 | 70+ | FRS API misses Tar Creek Superfund |
| Yellowstone, WY | 7 | 7 | Correct (clean baseline) |

---

## Key Takeaways

### Gaps competitors have that we fill
1. **No one scores contamination at an address level** — First Street and ClimateCheck
   do climate risk. EWG maps sites. ERIS serves consultants. Bedrock is the only
   platform that gives a regular person a contamination score for their address.
2. **No one combines water + soil + air + proximity + EJ** into a single composite.
   EWG does water only. First Street does air (smoke) only.
3. **PFAS + lead + Superfund in one report** — Nobody else does this.
4. **National compound-risk research** — SCVI, CFCI, and the redlining analysis are
   original research that no competitor publishes. These position Bedrock as a thought
   leader, not just a product.

### Features competitors have shipped that we should respond to
1. **First Street's 2060 projections** — We should consider adding forward-looking
   climate overlay (precipitation trend from NASA POWER is a start).
2. **First Street's Realtor.com integration** — Distribution via MLS/listing portals
   is the growth channel. Build an embeddable widget or API for listing pages.
3. **EWG's PFAS in wildlife map** — Expanding beyond human exposure to ecological
   impact is a potential content play for Intelligence briefs.
4. **ClimateCheck's portfolio analysis** — Pro users managing multiple properties
   need batch assessment. Consider adding a CSV upload flow.
5. **Telescope's UK launch** — International expansion is premature for Bedrock, but
   confirms the market for address-level environmental scoring exists globally.

### Threats
1. **First Street adding contamination data** — If they add PFAS/Superfund to their
   existing climate risk model, they have instant distribution via Realtor.com.
   Mitigation: ship faster on water and soil depth; their climate expertise doesn't
   translate to contamination science.
2. **Zillow/Redfin building in-house** — Large portals have the traffic and could
   build contamination scoring using the same public data sources. Mitigation: our
   Intelligence briefs and methodology transparency create brand credibility that
   a feature embedded in a listing page can't replicate.
3. **EPA improving its own tools** — EPA's EJScreen is getting better. If EPA builds
   a consumer-friendly exposure score, it could displace all private tools.
   Mitigation: EPA moves slowly; Bedrock's UX and composite scoring are years ahead.
   Also, EPA tools are screening tools, not consumer products.

---

## Strategic Priorities (Q3 2026)

### Must-do
1. **Ship EJ layer** — Eliminates the biggest scoring gap. South LA, Flint, Port Arthur
   all under-score by 15-25 points without environmental justice data.
2. **Ship Superfund static bundle** — Fixes the Picher/Camp Lejeune false negatives.
   ~1,300 sites with coordinates is a one-time data prep task.
3. **Ship Water System Risk Atlas** — Extends the Intelligence brief series and
   strengthens the water layer narrative. UCMR 5 data is already bundled.

### Should-do
4. **Air API key integration** — Moves air coverage from ~50% to ~90%. PM2.5 is a
   high-salience data point for consumers.
5. **Embeddable widget / API** — First step toward MLS/listing portal distribution.
   Even a simple "Bedrock Score: 43/100" badge could drive traffic.
6. **Batch assessment for Pro** — CSV upload → batch scoring → downloadable report.
   Required for real estate professionals managing portfolios.

### Could-do
7. **Forward-looking climate overlay** — Use NASA POWER precipitation trends to add
   "worsening" or "stable" indicators to flood and soil layers.
8. **Time-series violation trends** — Show whether a water system is improving or
   deteriorating over 5-10 years.
9. **Neighborhood comparison** — Compare composite scores across adjacent census tracts
   (spec exists in ROADMAP.md, partially designed).

---

## Market Size and Positioning

**Addressable market:**
- ~6M home sales/year in the US (NAR)
- ~2M home inspections/year (ASHI)
- Environmental due diligence is not yet standard in residential transactions (it is in commercial via Phase I ESAs)

**Bedrock's bet:** Environmental exposure data becomes as standard as flood zone disclosure in residential real estate. PFAS regulation (EPA MCLs finalized 2024) and lead service line replacement mandates accelerate this.

**Positioning matrix:**

|                        | Climate risk | Contamination risk |
|------------------------|--------------|--------------------|
| **Consumer/agent UX**  | First Street | **Bedrock** |
| **Enterprise/consultant** | ClimateCheck | ERIS |
| **Advocacy/education** | — | EWG |

Bedrock occupies the only empty quadrant that matters for residential real estate:
consumer-friendly contamination risk scoring.
