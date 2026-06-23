# Research Brief #4: Water System Risk Atlas

**Product Specification — June 2026**
Status: In Progress (Q2-Q3 2026)

---

## Overview

A nationwide assessment of public water system risk factors at the PWSID (Public Water System ID) level, covering PFAS detection patterns, drinking water violation history, and infrastructure-age proxies. This is the fourth Intelligence research brief, following the SCVI soil crisis map, CFCI flood-contamination map, and HOLC redlining analysis.

### What it answers

> "Which public water systems in the United States present the highest compound risk from PFAS contamination, regulatory violations, and aging infrastructure — and who do they serve?"

### Why it matters

- 176 million Americans have PFAS-contaminated drinking water (UCMR 5 data)
- EPA's UCMR 5 is the most comprehensive PFAS monitoring dataset ever published, but raw data is not accessible to non-technical consumers
- No existing public tool ranks water systems by compound risk (PFAS + violations + infrastructure age)
- Water is Bedrock's highest-weighted exposure layer (25%) — the Atlas provides national context for individual report scores

---

## Data Sources

### Primary (already integrated in Bedrock)

| Source | Agency | What it provides | Resolution | Current status |
|--------|--------|------------------|------------|----------------|
| UCMR 5 | EPA | PFAS analyte concentrations (ppt) for ~10,000 systems | PWSID (system-level) | Bundled as `data/ucmr5-by-pwsid.json` |
| SDWIS | EPA | Drinking water violations (MCL, TT, MRDL) | PWSID | Live API via Envirofacts |
| WQP | USGS | Ambient water quality detections (surface + groundwater) | Monitoring site | Live API, 7-mile bounding box |
| Census ACS B25034 | Census Bureau | Housing age distribution (pre-1950, pre-1986) | Block group | Bundled |

### New (required for Atlas)

| Source | Agency | What it provides | Resolution | Integration effort |
|--------|--------|------------------|------------|-------------------|
| SDWIS Water System Info | EPA | System type (community, transient), population served, source (ground/surface), county FIPS | PWSID | Envirofacts API; new endpoint |
| SDWIS Service Area | EPA | Counties and states served per PWSID | PWSID | Envirofacts API; enrich existing queries |
| Census ACS demographics | Census Bureau | Income, poverty, race/ethnicity for served population | County | Already available from SCVI pipeline |

### Stretch (optional for v1)

| Source | What it provides | Complexity |
|--------|------------------|------------|
| EPA Lead and Copper Rule data | Lead action level exceedances | Separate Envirofacts table; limited historical depth |
| State-level PFAS databases | State monitoring beyond UCMR 5 | 50 different formats; high integration cost |
| ASCE Infrastructure Report Card | State-level water infrastructure grades | Manual entry; 50 state grades |

---

## Compound Water Risk Index (CWRI)

### Formula

```
CWRI = (0.40 * PfasScore) + (0.35 * ViolationScore) + (0.25 * InfrastructureScore)
```

Normalized 0-100. Quartile assignment (Q1-Q4, equal count per quartile).

### Component: PFAS Score (40% weight)

Source: EPA UCMR 5 bundle

| Metric | Scoring |
|--------|---------|
| Any PFAS detected | Base score 20 |
| Max individual analyte > EPA MCL (4 ppt PFOA/PFOS, 10 ppt PFHxS/PFNA/HFPO-DA) | 70-90 based on magnitude |
| Number of analytes detected | +5 per analyte above 2 |
| Total PFAS sum > 50 ppt | Score 90+ |
| No UCMR 5 data (system not tested) | null (excluded from PFAS component; weight redistributed) |

Rationale: PFAS is the primary driver. UCMR 5 is authoritative and system-level. The 40% weight reflects the current regulatory moment — EPA finalized enforceable MCLs in 2024.

### Component: Violation Score (35% weight)

Source: EPA SDWIS

| Metric | Scoring |
|--------|---------|
| Health-based violations in last 5 years | 0: score 0; 1: 30; 2: 50; 3: 65; 5+: 80+ |
| Active/unresolved violations | +20 per active violation (max +40) |
| Total violations in last 10 years | Count / 20, normalized 0-100, weighted 0.35 |
| Violation type severity | MCL > TT > MR > MON (weighted by type) |

Rationale: Violations indicate regulatory failure. Health-based violations are the strongest signal. Active violations indicate ongoing risk.

### Component: Infrastructure Score (25% weight)

Source: Census ACS B25034 + SDWIS system metadata

| Metric | Scoring |
|--------|---------|
| % housing pre-1950 in service area | >30%: 80; 20-30%: 60; 10-20%: 40; <10%: 15 |
| % housing pre-1986 in service area | >50%: 70; 30-50%: 45; <30%: 15 |
| System source type | Groundwater: +10 (more vulnerable to local contamination) |
| Population served | <3,300: +10 (small systems have fewer resources) |

Rationale: Housing age is the best available proxy for lead service line risk and distribution system age. Small groundwater systems are disproportionately resource-constrained.

### Coverage handling

When a component is unavailable (e.g., no UCMR 5 testing for a system), its weight is redistributed proportionally across available components. Coverage metadata is tracked per system: `{ pfas: present|unmapped, violations: present|unmapped, infrastructure: present|partial }`.

---

## Scope

### Target universe

All U.S. community water systems (CWS) in SDWIS — approximately 50,000 systems serving 300+ million people. Non-community systems (transient, non-transient non-community) are excluded from v1 but can be added later.

### Prioritized subset

UCMR 5 testing covers approximately 10,000 systems (all systems serving > 3,300 people plus a sample of smaller systems). The Atlas will:

1. **Tier 1**: Full CWRI for ~10,000 UCMR-tested systems (PFAS + violations + infrastructure)
2. **Tier 2**: Partial CWRI for remaining ~40,000 CWS (violations + infrastructure only; PFAS = null)

Tier 2 systems receive a "PFAS Untested" badge and their CWRI is computed from the available 60% of weights (violation 58%, infrastructure 42% after redistribution).

---

## Build Pipeline

### Preprocessing (batch, offline)

Analogous to `scripts/build-scvi-national.ts`:

**Input:**
- `data/ucmr5-by-pwsid.json` (existing PFAS bundle)
- SDWIS API (violation history + system metadata)
- Census ACS (housing age by county)

**Processing:**
1. Load UCMR 5 bundle — extract all PWSIDs with PFAS data
2. For each PWSID: query SDWIS for violation history (last 10 years) and system info (population, source type, county)
3. Join county FIPS to Census ACS demographics
4. Compute PfasScore, ViolationScore, InfrastructureScore, CWRI
5. Assign quartiles (Q1-Q4)
6. Write to `data/water-atlas.json`

**Resilience:** Same retry/circuit-breaker/checkpoint pattern as SCVI pipeline.

**Estimated runtime:** ~10,000 SDWIS queries at 500ms spacing + 50ms UCMR lookup = ~90 minutes for Tier 1.

### Output schema

```typescript
interface WaterAtlasRecord {
  pwsid: string;
  systemName: string;
  stateCode: string;
  countyFips: string;
  populationServed: number;
  sourceType: 'groundwater' | 'surface' | 'mixed';

  cwri: number;           // 0-100
  cwriQuartile: 1 | 2 | 3 | 4;
  classification: 'Low' | 'Elevated' | 'High' | 'Severe';

  pfasScore: number | null;
  pfasMaxAnalyte: number | null;
  pfasExceedsMcl: boolean | null;
  pfasAnalyteCount: number | null;

  violationScore: number;
  healthViolations5yr: number;
  activeViolations: number;
  totalViolations10yr: number;

  infraScore: number;
  pctPre1950: number;
  pctPre1986: number;

  // Demographics (from county-level Census ACS)
  medianIncome: number;
  povertyRate: number;

  coverage: {
    pfas: 'present' | 'unmapped';
    violations: 'present' | 'unmapped';
    infrastructure: 'present' | 'partial';
  };
}
```

---

## Intelligence Brief: 4-Chapter Scrollytelling

Following the established pattern from Briefs #1-3.

### Chapter 1: "What's in Your Water?"

Framing chapter. Key narrative points:
- 176M Americans with PFAS in drinking water
- EPA finalized MCLs in 2024 — first enforceable limits for PFOA/PFOS
- UCMR 5 is the most comprehensive testing ever, but raw data is inaccessible
- Bedrock processed [N] water systems into a single risk ranking

**Visualization:** Hero stat counters (systems tested, population covered, MCL exceedances found)

### Chapter 2: "The Highest-Risk Systems"

Rankings and national patterns.
- Top 25 water systems by CWRI (table with columns: rank, system name, state, CWRI, PFAS score, violation score, population)
- Regional breakdown: which states have the most Q4 systems
- System size analysis: small systems vs. large systems risk distribution

**Visualization:** D3 choropleth at county or state level (color = average CWRI or Q4 system count). Top-25 ranked table.

### Chapter 3: "Who Bears the Burden?"

Equity analysis.
- Q4 vs Q1 demographics: income, poverty rate, racial composition
- Small systems (< 3,300 pop) vs large systems: violation rates, PFAS testing coverage
- States with highest untested populations (Tier 2 systems)

**Visualization:** Quartile bar chart (poverty rate by CWRI quartile). Population-tested vs population-untested by state.

### Chapter 4: "The Testing Gap"

Call to action on monitoring coverage.
- Only ~10,000 of ~50,000 CWS have UCMR 5 PFAS data
- Small systems exempted from UCMR 5 serve ~30M Americans
- States with voluntary PFAS testing programs vs states with none
- What consumers can do: request CCR, test independently, install filtration

**Visualization:** US map showing tested vs untested systems (dot map or proportional state bars)

---

## API Endpoint

### `GET /api/intelligence/water-atlas`

Query parameters:
- `?limit=25` — Results count (default 100)
- `?state=NJ` — Filter by two-letter state code
- `?quartile=4` — Filter by CWRI quartile (1-4)
- `?pwsid=NJ0714001` — Lookup specific system
- `?exceedsMcl=true` — Filter to systems with PFAS MCL exceedances

Response: JSON array of `WaterAtlasRecord` objects.

Caching: 1 hour (same as SCVI/CFCI endpoints).

### Integration with individual reports

When a user generates an exposure report and the geocoder resolves a PWSID:

1. Look up the PWSID in the water-atlas dataset
2. Display a `WaterAtlasContext` panel (similar to `CfciCountyContext`) showing:
   - CWRI score and quartile
   - PFAS status (detected/exceeds MCL/untested)
   - Violation summary
   - Link to full Water Atlas brief

---

## UI Components

### New components

| Component | Description |
|-----------|-------------|
| `WaterAtlasClient.tsx` | Client page with 4-chapter scrollytelling + D3 charts |
| `WaterSystemMap.tsx` | D3 or Mapbox dot map of water systems colored by CWRI |
| `WaterAtlasContext.tsx` | Per-report context panel (like `CfciCountyContext`) |
| `WaterSystemTable.tsx` | Sortable top-N table with system details |

### Reused components

- `ScrollReveal`, `CountUp`, `QuartileBarChart` — from existing briefs
- `Label`, `Headline`, `Body`, `Mono` — typography system
- `Card`, `CardContent` — section containers
- `RiskBadge`, `ResolutionBadge` — existing UI primitives

---

## Intelligence Hub Update

Update `/app/intelligence/page.tsx`:

Move "Water System Risk Atlas" from `upcoming` array to `briefs` array:

```typescript
{
  number: 4,
  title: 'Water System Risk Atlas',
  stat: '50,000 systems',
  description:
    'National ranking of public water systems by compound risk — PFAS detection, violation history, and infrastructure age. The data EPA collects but doesn\'t score.',
  image: 'chapter-water',
  href: '/intelligence/water-atlas',
}
```

---

## Testing Plan

### Unit tests

- CWRI scoring function: threshold edge cases, weight redistribution when components null
- PfasScore: MCL boundary (3.9 ppt vs 4.1 ppt), multi-analyte counting
- ViolationScore: health-based vs non-health-based weighting, active violation boost
- InfrastructureScore: housing age thresholds, small-system bonus, groundwater bonus
- Coverage tracking: all permutations of present/unmapped components

### Integration tests

- API endpoint returns valid data for known PWSID
- Quartile distribution is balanced (equal count per quartile)
- State filter returns only systems in that state
- MCL exceedance filter works correctly

### Smoke tests

- Full build pipeline completes for a 100-system sample
- Water Atlas page renders without errors
- Context panel appears in individual reports when PWSID matches

---

## Estimated Effort

| Task | Estimate |
|------|----------|
| Build pipeline (`scripts/build-water-atlas.ts`) | 1.5 days |
| API route + caching | 0.5 day |
| CWRI scoring module (`lib/intelligence/cwri-scorer.ts`) | 1 day |
| D3 visualizations (choropleth, dot map, bar charts) | 2 days |
| 4-chapter scrollytelling client page | 1.5 days |
| `WaterAtlasContext` panel in individual reports | 0.5 day |
| Unit + integration tests | 1 day |
| **Total** | **8 days** |

---

## Open Questions

1. **Dot map vs choropleth?** Individual water systems are point features, not county polygons. A dot map (Mapbox GL) may be more appropriate than a D3 choropleth. However, ~50,000 dots is expensive to render — may need to cluster or aggregate to county level for the national view.

2. **Include non-community systems?** Schools, hospitals, and factories have their own PWSIDs. Including them would expand coverage but complicate the narrative ("your child's school water" vs "your home water").

3. **State-level PFAS data?** Some states (NJ, CA, MI) test for PFAS beyond UCMR 5. Including state data would improve coverage but introduces inconsistency (different analytes, different detection limits across states).

4. **Historical violation trends?** The current spec uses snapshot data (5yr/10yr windows). A time-series view ("your water system has improved/worsened over 10 years") would be compelling but significantly increases data volume and pipeline complexity.
