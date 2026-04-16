# Scoring Pipeline Improvement Log

## Data Accuracy Audit — 9 Canonical Addresses (2026-04-16)

### Full Coverage Table (SCORING_VERSION 3, FULL_WEIGHTS)

| Address              | Comp | Water | Soil | Air | Prox | EJ  | Coverage | Notes |
|----------------------|------|-------|------|-----|------|-----|----------|-------|
| Port Arthur TX       |   58 |    68 |   56 |  61 |   45 |  0* |     76%  | Refinery corridor, SO2+Ozone nonattainment |
| Newark NJ            |   56 |    59 |   44 |  61 |   56 |  0* |     85%  | Industrial + brownfields + lead |
| South LA (90002)     |   52 |    46 |   59 |  59 |   44 |  0* |     80%  | Urban EJ burden, CA nonattainment |
| Miami Beach FL       |   39 |    85 |   58 |  12 |    0 |  0* |     65%  | Coastal flood + high PFAS |
| Flint MI             |   37 |    47 |   47 |  29 |   27 |  0* |     80%  | Lead crisis city |
| Salinas CA           |   33 |    20 |   61 |  29 |   32 |  0* |     80%  | Agricultural area, CA nonattainment |
| Hoosick Falls NY     |   28 |    59 |    9 |   9 |   27 |  0* |     80%  | PFOA water contamination |
| Picher OK            |   18 |    32 |   32 |   0 |   11 |  0* |     68%  | Tar Creek Superfund (abandoned town) |
| Yellowstone WY       |    7 |    20 |    7 |   0 |    0 |  0* |     75%  | Rural/clean baseline |

*EJ layer unavailable — requires EJScreen/SVI external API access.

### Ground-Truth Cross-Check

#### Picher, Oklahoma (Score: 18 — EXPECTED: 70+)

**Published reality**: Tar Creek was added to EPA's National Priorities List in 1983.
Lead and zinc mining contamination (lead, zinc, cadmium in mine tailings). Blood lead
levels in children were documented at alarming rates. EPA conducted a federal buyout;
Picher was dissolved as a town by 2009. Widely cited as one of the worst Superfund
sites in US history.

**Why our score is wrong (18 vs expected 70+)**:
1. **Superfund not detected**: EPA FRS SEMS query returns 0 sites within 5mi radius.
   The Tar Creek Superfund boundary may not have facility-level records in FRS, or the
   SEMS program filter doesn't match the site's registration. The site is massive
   (40-square-mile mining district) and may be registered differently.
2. **No water system**: Town abandoned — no PWSID, so no SDWIS violations or UCMR data.
   Water score (32) comes only from lead housing risk (64% pre-1986).
3. **No air monitoring**: No OpenAQ station within range, no AQS data without API key,
   not in nonattainment bundle. Air score = 0.
4. **EJ unavailable**: Would likely score very high on social vulnerability.

**Action items**:
- [ ] Add Tar Creek to a static Superfund bundle (similar to nonattainment) to ensure
      it's captured regardless of FRS API behavior
- [ ] Consider adding CERCLIS/SEMS site data as a supplemental source
- [ ] Investigate whether abandoned towns need special handling in the water scorer

#### Port Arthur, Texas (Score: 58 — EXPECTED: 65-80)

**Published reality**: Gulf Coast industrial corridor with Motiva (one of North
America's largest refineries), multiple petrochemical plants. Jefferson County
(FIPS 48245) is designated nonattainment for SO2 and ozone. Community is majority
low-income and minority. Multiple TRI facilities. EJScreen percentiles for air
toxics cancer risk, RMP proximity, and hazardous waste proximity are very high.

**Score assessment**: 58 is directionally correct but likely under-scores.
- Air score (61) captures nonattainment correctly (SO2 + Ozone, Moderate classification)
- Proximity (45) reflects ECHO facility density
- Water (68) reflects local water system issues
- **Missing EJ layer** would add significant burden (demographic index likely 80th+ percentile)

**Action items**:
- [ ] When EJ layer is functional, verify Port Arthur scores 70+ overall
- [ ] Consider adding EPA's Risk-Screening Environmental Indicators (RSEI) for
      cancer risk from air toxics

#### Flint, Michigan (Score: 37 — EXPECTED: 55-70)

**Published reality**: Flint water crisis (2014-2019) — lead leaching from
corroded pipes after switching water source. Brownfield contamination from
automotive manufacturing legacy. EPA emergency orders issued.

**Score assessment**: 37 is too low for a city synonymous with environmental crisis.
- Water (47): Captures lead risk (pre-1986 housing) but misses the specific lead
  crisis because SDWIS violations are historical and may have aged off
- Soil (47): Brownfields and industrial legacy captured
- Air (29): Moderate — some nonattainment contribution
- Proximity (27): Some ECHO facilities but moderate density
- **Missing EJ**: Flint's high social vulnerability would significantly boost the score

**Action items**:
- [ ] Investigate whether Flint's SDWIS violations from 2015-2019 appear in the
      current Envirofacts database
- [ ] When EJ functional, verify Flint scores 55+ (high SVI expected)

#### South Los Angeles (Score: 52 — EXPECTED: 60-75)

**Published reality**: ZIP 90002 (Watts area) is one of California's most
environmentally burdened zip codes. South Coast Air Basin in nonattainment for
ozone and PM2.5. CDC SVI scores 0.90+ across all themes. CalEnviroScreen ranks
these tracts in top 5-10% statewide. Diesel PM, traffic pollution, lead from
older housing, proximity to industrial facilities and freeways.

**Score assessment**: 52 is reasonable without EJ but should be 65-75 with it.
- Air (59): Captures CA nonattainment (LA County — Serious for PM2.5+Ozone+Lead)
- Soil (59): Industrial/urban land use
- Proximity (44): Moderate facility density
- **Missing EJ** is the biggest gap — this area's defining characteristic is
  environmental injustice and cumulative burden

**Action items**:
- [ ] When EJ functional, verify South LA scores 65+ (demographic index 85th+ percentile expected)
- [ ] LA County (06037) correctly shows Serious classification with PM2.5+Ozone+Lead

### Summary of Findings

**What works well**:
- Rank order is mostly correct for the 4 available layers (industrial/urban areas > rural)
- Nonattainment data accurately identifies CA, TX, NJ pollution areas
- ECHO facility counts correlate with known industrial corridors
- Miami Beach correctly flagged for water contamination (85) and flood risk

**Systemic gaps**:
1. **EJ layer non-functional without API keys** — This affects all 9 addresses
   equally. When functional, expect score increases of 5-15 points for urban/
   disadvantaged areas (South LA, Port Arthur, Flint, Newark).
2. **Superfund coverage gap** — FRS SEMS radius search misses some NPL sites.
   A static bundle of ~1,300 active NPL sites with coordinates would be more
   reliable than the FRS API.
3. **Air coverage at 50%** — Without OpenAQ/AQS API keys, only nonattainment
   and TRI sub-components are available. Full air scoring needs credentials.
4. **Abandoned town handling** — Picher has no water system, no active monitoring.
   The scoring pipeline has no mechanism to flag historical contamination that
   preceded data collection systems.
