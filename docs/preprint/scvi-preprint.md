# A National Soil Contamination Vulnerability Index: Coupling Intrinsic Soil Properties with Anthropogenic Contamination Pressure Across 3,140 U.S. Counties

**Bedrock Environmental Intelligence**
Draft preprint — June 2026

---

## Abstract

Soil contamination in the United States is governed by two independent but interacting dimensions: the intrinsic vulnerability of soil to retain and mobilize contaminants, and the density and severity of anthropogenic contamination sources. Federal datasets addressing these dimensions exist but are siloed across agencies (USDA, EPA, NASA, FEMA), and no national composite assessment links them at the county level. We introduce the Soil Contamination Vulnerability Index (SCVI), a multiplicative composite defined as SCVI = sqrt(SVS * CPI), where SVS (Soil Vulnerability Sub-index) captures pedological and climatic properties from USDA SSURGO and NASA POWER, and CPI (Contamination Pressure Index) captures legacy site density, active industrial facility load, compliance violations, and toxic releases from four EPA databases. We compute SCVI for all 3,140 U.S. counties and merge results with Census ACS 2022 demographics. The observed SCVI range is 0-60 (mean 27.4, median 27). Counties in the highest-risk quartile (Q4, n=785) exhibit 2.3x the poverty rate of Q1 counties, with geographic clustering along the Gulf Coast, Mid-Atlantic industrial corridor, Mississippi Delta, and Appalachia. Virginia independent cities dominate the top 20, reflecting concentrated industrial heritage within small jurisdictions. The multiplicative formulation ensures high SCVI requires both vulnerable soil and contamination pressure — a design choice validated by the observation that high-SVS agricultural counties with low CPI correctly score low. All data, methodology, and code are open. SCVI provides a screening-level national baseline for prioritizing soil health investigation and environmental justice interventions.

---

## 1. Introduction

Soil contamination affects human health through direct contact, vapor intrusion, and mobilization into drinking water and food systems. The severity of contamination at any location depends on two largely independent factors: (1) the intrinsic properties of the soil — its texture, organic matter content, pH, drainage, and susceptibility to erosion — which determine how readily contaminants bind, leach, or mobilize; and (2) the external contamination pressure — the density and proximity of industrial facilities, Superfund sites, brownfields, and toxic releases that introduce contaminants into the local environment.

Federal datasets exist for both dimensions but are managed by different agencies with different spatial resolutions, update schedules, and access modalities. The USDA's Soil Survey Geographic Database (SSURGO) provides detailed pedological data at the soil map unit level. The EPA maintains facility-level databases (ECHO, TRI, FRS/SEMS, Brownfields) and site-level contamination records. NASA's POWER API provides gridded climate data relevant to erosion and leaching. No existing product, public or private, combines these into a county-level composite that captures the interaction between soil vulnerability and contamination pressure.

We address this gap with the Soil Contamination Vulnerability Index (SCVI), a two-factor multiplicative index designed for national screening. The key design principle is that high risk requires both factors: vulnerable soil alone or contamination pressure alone does not produce a high composite score.

### 1.1 Objectives

1. Define a reproducible, transparent methodology for scoring soil contamination vulnerability at the county level
2. Compute SCVI for all 3,140 U.S. counties using exclusively federal open data
3. Characterize the national distribution, geographic clustering, and demographic correlates of soil contamination vulnerability
4. Identify limitations and known data gaps to guide future investigation

---

## 2. Methods

### 2.1 Index Architecture

SCVI is the geometric mean of two sub-indices:

```
SCVI = sqrt(SVS * CPI)
```

where SVS (Soil Vulnerability Sub-index) and CPI (Contamination Pressure Index) each range from 0-100. The square root maps the 0-10,000 product space back to 0-100 while preserving the multiplicative interaction: both factors must be elevated for SCVI to be high. This formulation is analogous to compound risk indices used in flood-contamination assessment (e.g., the CFCI used in Brief #2 of this series).

Counties are assigned to quartiles (Q1-Q4, 785 counties each) based on SCVI rank, where Q4 represents the highest vulnerability.

### 2.2 Soil Vulnerability Sub-index (SVS)

SVS is a weighted average of six scored components derived from USDA SSURGO and NASA POWER:

| Component | Weight | Source | Resolution |
|-----------|--------|--------|------------|
| Organic matter content | 25% | USDA SSURGO | Map unit (~1-100 acres) |
| Drainage class | 25% | USDA SSURGO | Map unit |
| Soil pH | 20% | USDA SSURGO | Map unit |
| Soil texture (sand/clay fraction) | 15% | USDA SSURGO | Map unit |
| Climate erosivity (precipitation + aridity) | 10% | NASA POWER | ~50 km grid |
| Urban data gap penalty | 5% | SSURGO urban designation | Map unit |

Each component is scored on a 0-100 scale using threshold-based step functions derived from soil science literature:

**Organic matter:** Soils with >= 3% organic matter (score 10) effectively sequester contaminants; soils below 1% (score 90) have minimal binding capacity. Thresholds follow NRCS soil health guidelines.

**pH:** The optimal range of 6.0-7.0 (score 10) minimizes heavy metal mobility. Strongly acidic soil (pH < 5.0, score 90) increases metal solubility; strongly alkaline soil (pH > 8.0, score 90) affects nutrient availability and can mobilize certain contaminants.

**Drainage class:** Well-drained soils (score 10) allow contaminant transport to groundwater but are less prone to surface accumulation. Excessively drained soils (score 75) transmit contaminants rapidly. Very poorly drained soils (score 85) accumulate surface contaminants. Scoring reflects the U-shaped relationship between drainage and vulnerability.

**Texture:** Sandy soils (> 70% sand, score 80) have high permeability and low adsorption capacity. Heavy clay (> 50%, score 50) retains contaminants but can crack, creating preferential flow paths. Loam (score 20) provides optimal balance. When particle-size data is unavailable, saturated hydraulic conductivity (Ksat) is used as a proxy.

**Climate erosivity:** High precipitation (> 1,400 mm/yr, score 70) drives physical erosion and contaminant leaching. Arid conditions (aridity index < 0.3, score 60) concentrate contaminants in shallow soil. The maximum of precipitation and aridity scores is used.

**Urban data gap:** Urban land cover with missing NDVI anomaly data receives a penalty score (50-80) to avoid false negatives in areas where soil surveys are sparse due to impervious surface cover.

### 2.3 Contamination Pressure Index (CPI)

CPI is a weighted sum of four scored components from EPA databases:

| Component | Weight | Source | Metric |
|-----------|--------|--------|--------|
| Legacy contamination | 35% | EPA Brownfields + Superfund (FRS/SEMS) | Site count + proximity |
| Industrial density | 35% | EPA ECHO + TRI | Facilities per sq. mile |
| Compliance violations | 15% | EPA ECHO (SNC) | Count of significant non-compliance events |
| Toxic releases | 15% | EPA TRI | Total on-site releases (lbs) |

**Legacy contamination:** Superfund NPL sites within 1 mile (score 95), 1-3 miles (75), or > 3 miles (65) provide the strongest signal. Brownfield counts supplement: > 5 sites (70), 1-5 (40). The maximum of Superfund and brownfield scores is used.

**Industrial density:** Facility count (ECHO + TRI) normalized by county area: > 10/sq. mi. (score 90) to < 0.1/sq. mi. (score 0). This captures both concentrated urban-industrial areas and diffuse rural contamination from agricultural chemicals.

**Compliance violations:** Significant Non-Compliance (SNC) events: > 5 (score 90), 1-5 (60), 0 (10). SNC represents the most serious category of EPA enforcement action.

**Toxic releases:** Annual on-site TRI releases: > 1M lbs (score 95), 100K-1M (70), 10K-100K (45), > 0 (20). On-site releases directly affect local soil and groundwater.

### 2.4 Data Collection and Processing

The batch pipeline processes all 3,140 counties by:

1. Loading a county reference table with FIPS codes, centroids, and areas from Census TIGER files
2. For each county: querying SSURGO (dominant soil), NASA POWER (30-year climate normals), EPA Brownfields (radius search), Superfund (FRS SEMS radius), ECHO (regulated facilities), and TRI (toxic releases) in parallel
3. Multi-point sampling for large counties (>= 1,000 sq. mi.) using 3 sample points with results averaged
4. Computing SVS, CPI, and SCVI per county
5. Merging with Census ACS 2022 5-year estimates (median household income, poverty rate, racial/ethnic composition)

The pipeline implements exponential-backoff retry (5 retries, 2s-32s + jitter), circuit-breaker logic (3 consecutive 503 errors trigger 60s pause), and checkpoint-resume capability for crash recovery. Processing batches of 20 counties with 500ms inter-batch delay to respect API rate limits.

### 2.5 Coverage Tracking

Each county record includes coverage metrics: SVS data points achieved (out of 6 maximum) and CPI data points achieved (out of 4 maximum). Of 3,140 counties, 3,131 (99.7%) achieved complete data coverage. Nine Connecticut planning regions lacked demographic overlap but received SCVI scores.

---

## 3. Results

### 3.1 National Distribution

| Statistic | Value |
|-----------|-------|
| Counties scored | 3,140 |
| Observed SCVI range | 0 - 60 |
| Mean SCVI | 27.4 |
| Median SCVI | 27 |
| Counties per quartile | 785 |
| Data completeness | 99.7% (3,131 / 3,140) |

The distribution is approximately normal with a slight right skew, consistent with the square-root transformation compressing extreme values from the product space.

### 3.2 Highest-Risk Counties

| Rank | County | State | SCVI | SVS | CPI |
|------|--------|-------|------|-----|-----|
| 1 | Covington city | VA | 60 | 50 | 72 |
| 2 | Harrison | MS | 60 | 71 | 51 |
| 3 | Danville city | VA | 58 | 47 | 72 |
| 4 | Duval | FL | 57 | 57 | 58 |
| 5 | Martinsville city | VA | 56 | 43 | 72 |
| 6 | Hopewell city | VA | 56 | 43 | 72 |
| 7 | Williamsburg city | VA | 54 | 45 | 64 |
| 8 | Waynesboro city | VA | 54 | 45 | 64 |
| 9 | Suffolk | MA | 53 | 43 | 66 |
| 10 | Hampden | MA | 53 | 49 | 58 |

### 3.3 Geographic Clustering

Virginia independent cities dominate the top 20. These are small-area jurisdictions (often < 10 sq. mi.) with concentrated industrial legacy and urban soil conditions. The pattern reflects a structural feature of Virginia's county-equivalent system rather than uniquely severe contamination — industrial pressure is concentrated in a small denominator area.

Beyond Virginia, clustering occurs in:

- **Gulf Coast** (Harrison County MS, Gulf-adjacent LA/TX counties): vulnerable alluvial soils (high SVS) combined with petrochemical industrial density (high CPI)
- **Mid-Atlantic industrial corridor** (Suffolk/Hampden MA, Essex NJ): post-industrial urban areas with moderate-to-high SVS and high CPI from legacy manufacturing
- **Mississippi Delta**: alluvial soils with agricultural chemical legacy
- **Appalachia**: mining-region counties with legacy contamination and weathered soils

### 3.4 Multiplicative Interaction Validation

The index design is validated by examining cases where SVS and CPI diverge:

- **Harrison County, MS** (SVS 71, CPI 51 -> SCVI 60): High soil vulnerability (alluvial, poorly drained) combined with moderate industrial pressure produces high composite — the multiplicative interaction amplifies risk where both factors are present
- **Passaic County, NJ** (SVS 27, CPI 63 -> SCVI 41): Resilient soil (well-drained, adequate organic matter) buffers high contamination pressure — CPI alone does not drive high SCVI
- **Duval County, FL** (SVS 57, CPI 58 -> SCVI 57): Balanced elevation across both dimensions produces the highest composite scores

Agricultural counties with high SVS but minimal industrial presence correctly score low. This confirms the model does not penalize vulnerable but uncontaminated rural areas.

### 3.5 Demographic Correlates

Merging SCVI quartiles with Census ACS 2022 reveals significant disparities:

| Metric | Q1 (Low) | Q4 (High) | Ratio |
|--------|----------|-----------|-------|
| Poverty rate | ~11% | ~25% | 2.3x |
| Median household income | Higher | Lower | ~0.65x |

Q4 counties have 2.3 times the poverty rate of Q1 counties, consistent with the environmental justice literature documenting that contaminated industrial sites are disproportionately located in low-income communities. Whether this reflects siting decisions (polluting industries locate in low-income areas) or property-value effects (contamination depresses property values and income) cannot be determined from cross-sectional data.

---

## 4. Discussion

### 4.1 Contributions

SCVI is, to our knowledge, the first published national county-level index that explicitly couples intrinsic soil vulnerability with anthropogenic contamination pressure using a multiplicative formulation. Existing federal tools address individual dimensions: USDA publishes soil health indicators, EPA publishes facility and contamination site databases, and EPA's EJScreen provides environmental justice screening. None combine soil pedology with contamination source density into a single composite.

The multiplicative design (geometric mean) is a deliberate methodological choice. Additive indices (e.g., simple weighted sums) can produce high scores when only one dimension is elevated. In contamination risk assessment, a region with highly vulnerable soil but no contamination sources is not at risk, and a region with many contamination sources but resilient soil that effectively binds contaminants presents lower risk than the sources alone would suggest. The geometric mean enforces this interaction.

### 4.2 Limitations

**Superfund coverage gap.** The EPA's FRS SEMS API, used for Superfund NPL site proximity, misses some documented NPL sites. Testing confirmed that Picher, Oklahoma (Tar Creek Superfund site) and Camp Lejeune, North Carolina return zero hits from the API despite active NPL designation. A planned supplemental static bundle of approximately 1,300 NPL sites with coordinates will address this gap.

**VOC blindspot.** The UCMR 5 dataset, which informs the water layer of the broader exposure model, covers PFAS compounds but not volatile organic compounds (TCE, PCE, benzene, vinyl chloride). Counties with VOC contamination from industrial solvents or petroleum spills (e.g., East Palestine, Ohio) may be under-scored.

**Federal data latency.** Acute contamination events (e.g., the 2023 East Palestine train derailment) require 1-3 years to appear in federal databases. SCVI reflects the regulatory record, not real-time conditions.

**Military base gap.** Active military installations lack Census ACS demographic data, creating null values for lead-risk proxies and demographic overlays in those areas.

**Urban data gap.** SSURGO coverage in heavily urbanized areas is sparser than in agricultural regions. The 5% urban data gap penalty partially addresses this but may not fully capture soil conditions under impervious surfaces.

**NDVI integration pending.** The SVS design includes an urban vegetation stress component (NDVI anomaly) that currently defaults to a placeholder score of 50 pending satellite data integration.

**Screening-level resolution.** County-level scoring averages over significant intra-county variation. A county with one Superfund site in an otherwise clean rural area will score differently than one with distributed contamination. SCVI is designed for national screening and prioritization, not site-level assessment.

### 4.3 Relationship to Companion Indices

SCVI's CPI component is shared with the Compound Flood-Contamination Index (CFCI = sqrt(Flood Exposure * CPI)), which identifies 783 counties where flood risk and contamination pressure compound. The redlining analysis links county-level SCVI/CPI to census-tract-level HOLC grades, finding that Grade D (redlined) neighborhoods are concentrated in counties with elevated SCVI.

Together, these indices form a three-part national screening framework:
1. **SCVI**: Where soil vulnerability meets contamination pressure
2. **CFCI**: Where flood exposure compounds contamination mobilization risk
3. **HOLC-SCVI linkage**: Where historical disinvestment correlates with present-day contamination vulnerability

---

## 5. Conclusion

The Soil Contamination Vulnerability Index provides a national baseline for identifying counties where intrinsic soil vulnerability and anthropogenic contamination pressure interact. The 785 Q4 counties — disproportionately low-income, geographically clustered in post-industrial and petrochemical regions — represent priority targets for soil health investigation, remediation funding, and environmental justice intervention. The open methodology and data enable replication, critique, and extension.

---

## Data Availability

- National dataset (3,140 counties): `data/scvi-national.json`
- Scoring methodology: `lib/intelligence/scvi-scorer.ts`
- Batch pipeline: `scripts/build-scvi-national.ts`
- Unit tests (47+ cases): `tests/unit/intelligence/scvi-scorer.test.ts`
- Interactive visualization: bedrockenvironment.com/intelligence/soil-crisis

## Data Sources

| Source | Agency | Resolution | Access |
|--------|--------|------------|--------|
| SSURGO Soil Survey | USDA NRCS | Map unit (1-100 acres) | Web Soil Survey API |
| POWER Climate Data | NASA | ~50 km grid | POWER API |
| Brownfields Database | EPA | Site coordinates | Brownfields API |
| FRS/SEMS (Superfund NPL) | EPA | Site coordinates | FRS SEMS API |
| ECHO Regulated Facilities | EPA | Facility coordinates | ECHO API |
| Toxic Release Inventory | EPA | Facility coordinates | TRI/ECHO API |
| ACS 5-Year Estimates 2022 | Census Bureau | County | Census API |

## Acknowledgments

SCVI computation uses exclusively U.S. federal open data. We acknowledge the USDA Natural Resources Conservation Service (SSURGO), NASA Langley Research Center (POWER), the U.S. Environmental Protection Agency (ECHO, TRI, Brownfields, FRS/SEMS), the U.S. Census Bureau (ACS), and FEMA (NFHL) for maintaining publicly accessible datasets.
