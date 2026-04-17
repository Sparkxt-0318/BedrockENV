# Market Intelligence — Environmental Exposure Platforms (April 2026)

## Competitor Landscape

### First Street Foundation (Risk Factor)
- **Position**: Market leader in climate risk scoring for real estate
- **Model**: Property-level 1-10 scores for flood, wildfire, wind, heat, air
- **Distribution**: Integrated into Realtor.com, Redfin via RPR (Realtors Property Resource)
- **Updates**: Quarterly data updates, annual model refreshes
- **API**: Enterprise pricing, portfolio-level aggregation
- **Recent**: Added annual flood damage estimates for residential properties

**Bedrock differentiation**: First Street focuses on *climate* risk (future projections).
Bedrock focuses on *contamination* risk (current exposure from water, soil, air, proximity).
Complementary, not competitive. First Street does NOT cover PFAS, lead, Superfund,
brownfields, SDWIS violations, or environmental justice. Their "air" peril is wildfire
smoke, not industrial pollution or nonattainment.

### ClimateCheck
- **Position**: Climate risk scoring with 2060 projection capability
- **Model**: 1-100 scores for heat, precipitation, wildfire, drought, wind, flood
- **Target**: Enterprise — equity investors, environmental consultants, listing portals
- **Pricing**: Free basic report, enterprise tiers undisclosed
- **Recent**: 5-year increment projections through 2060

**Bedrock differentiation**: Same as First Street — ClimateCheck is climate-forward
(temperature, precipitation, wildfire), not contamination-focused. No water quality,
no Superfund proximity, no SDWIS data, no PFAS.

### EWG (Environmental Working Group)
- **Position**: Consumer advocacy + PFAS contamination mapping
- **Product**: Interactive PFAS map (9,728+ sites), Tap Water Database, Dirty Dozen list
- **Data**: UCMR 5 (EPA 11th round released March 2026), state databases, academic studies
- **Recent 2026**: Published PFAS pesticide guide (March 2026), updated PFAS in wildlife map
- **Model**: Free, donation-supported nonprofit

**Bedrock differentiation**: EWG maps contamination *sites* but does not score
*addresses*. No composite scoring, no per-address assessment, no report generation.
EWG is a lookup tool ("is there PFAS near me?"), not an assessment platform. We use
the same UCMR 5 data but wrap it in a multi-layer scoring model with confidence
tracking and coverage honesty.

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
- **Coverage**: Europe-focused (Norway origin), expanding
- **Features**: Wildfire, flooding, soil contamination, biodiversity
- **Model**: Address-based instant assessment

**Bedrock differentiation**: Telescope is the closest competitor in UX intent (enter
address, get instant assessment). However: (1) US-focused data sources give us depth
they can't match (UCMR 5, SDWIS, ECHO, FRS, EJScreen are US-only federal datasets),
(2) they focus on climate + biodiversity, we focus on contamination + environmental
justice.

## Key Takeaways

### Gaps competitors have that we fill
1. **No one scores contamination at an address level** — First Street and ClimateCheck
   do climate risk. EWG maps sites. ERIS serves consultants. Bedrock is the only
   platform that gives a regular person a contamination score for their address.
2. **No one combines water + soil + air + proximity + EJ** into a single composite.
   EWG does water only. First Street does air (smoke) only.
3. **PFAS + lead + Superfund in one report** — Nobody else does this.

### Features competitors have shipped that we should respond to
1. **First Street's 2060 projections** — We should consider adding forward-looking
   climate overlay (precipitation trend from NASA POWER is a start).
2. **First Street's Realtor.com integration** — Distribution via MLS/listing portals
   is the growth channel. Consider building an embeddable widget or API.
3. **EWG's PFAS in wildlife map** — Expanding beyond human exposure to ecological
   impact is a potential content play.
4. **ClimateCheck's portfolio analysis** — Pro users managing multiple properties
   need batch assessment. Consider adding a CSV upload flow.

### Threats
1. **First Street adding contamination data** — If they add PFAS/Superfund to their
   existing climate risk model, they have instant distribution via Realtor.com.
2. **Zillow/Redfin building in-house** — Large portals have the traffic and could
   build contamination scoring using the same public data sources.
3. **EPA improving its own tools** — EPA's EJScreen is getting better. If EPA builds
   a consumer-friendly exposure score, it could displace all private tools.
