# `data/` — preprocessed data bundles

This directory holds data files that BedrockENV ships with the repo instead of
fetching at runtime. Two things land here:

1. **Federal datasets that have no public REST API.** When the only
   authoritative source is a downloadable ZIP (or an 8 GB Oracle dump), we
   preprocess it into a compact lookup file and commit the result. The runtime
   client reads the file once per process and answers queries in O(1).

2. **Small reference tables** that would otherwise bloat the client bundle if
   imported as `.ts`.

Files currently tracked here must be regenerated whenever the upstream dataset
updates. Each bundle is documented below along with the exact command to
refresh it.

---

## `ucmr5-by-pwsid.json`

EPA UCMR 5 PFAS occurrence data, keyed by PWSID.

- **Upstream:** EPA publishes UCMR 5 results as quarterly ZIPs at
  <https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule>.
  There is **no** Envirofacts REST endpoint for UCMR 5. Previously we spent
  cycles confirming this — the table simply isn't exposed.
- **Source file:** `ucmr5-occurrence-data.zip` → `UCMR5_All.txt` (~300 MB,
  ~1.9 million rows)
- **Refresh cadence:** EPA releases new UCMR 5 data quarterly (~90 days). The
  runtime client logs a console warning when the committed bundle is more than
  100 days old (`UCMR5_STALE_DAYS` in `lib/data-sources/epa-ucmr5.ts`).
- **Generator:** [`scripts/build-ucmr5-data.ts`](../scripts/build-ucmr5-data.ts)
- **Refresh procedure:**

  ```bash
  # 1. Fetch the upstream ZIP
  curl -L -o /tmp/ucmr5-occurrence-data.zip \
    'https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip'

  # 2. Note the Last-Modified header (== EPA release date)
  curl -sI 'https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip' \
    | grep -i last-modified

  # 3. Unzip to the default working directory
  mkdir -p /tmp/ucmr5_work
  unzip -d /tmp/ucmr5_work /tmp/ucmr5-occurrence-data.zip

  # 4. Regenerate the bundle (pass the release date captured above)
  pnpm tsx scripts/build-ucmr5-data.ts --release-date YYYY-MM-DD
  ```

  The script writes `data/ucmr5-by-pwsid.json` and prints the row count,
  PWSID count, and the recorded EPA release date.

- **Fields:**

  ```jsonc
  {
    "generatedAt": "ISO timestamp when the bundle was built",
    "epaReleaseDate": "YYYY-MM-DD from the upstream ZIP's Last-Modified header",
    "source": "EPA UCMR 5 Occurrence Data",
    "sourceUrl": "...",
    "rowCount": 37546,
    "pwsidCount": 3539,
    "systems": {
      "DC0000003": {
        "systemName": "NAVAL STATION WASHINGTON - WNY",
        "state": "DC",
        "size": "S",
        "analytes": [
          { "name": "PFOA", "concentration": 4.3, "mcl": 4, "exceedsMcl": true }
        ],
        "maxIndividual": 4.3,
        "totalPfas": 6.1,
        "exceedsMcl": true,
        "firstSampleDate": "2023-09-12",
        "lastSampleDate": "2024-06-18"
      }
    }
  }
  ```

---

## `nonattainment.json`

EPA Green Book county-level nonattainment designations, keyed by county FIPS.

- **Upstream:** EPA Green Book data download at <https://www.epa.gov/green-book/green-book-data-download>. No REST API — published as downloadable CSV/XLSX.
- **Refresh cadence:** EPA designates and redesignates nonattainment areas when NAAQS are set or revised; in practice this changes a handful of counties per year. Rebuild when EPA announces new designations.
- **Generator:** Manual — currently hand-curated. No build script. The file as of 2025-01-15 covers 198 counties across pollutants PM2.5, Ozone, Lead, SO2, CO, NO2.
- **Runtime client:** `lib/data-sources/nonattainment.ts` — `lookupNonattainment(stateFips, countyFips)` returns `{ pollutants: string[], classification: string } | null`.
- **Fields:**

  ```jsonc
  {
    "generatedAt": "ISO timestamp",
    "source": "EPA Green Book",
    "sourceUrl": "https://www.epa.gov/green-book/green-book-data-download",
    "countyCount": 198,
    "counties": {
      "06037": { "pollutants": ["PM2.5", "Ozone", "Lead"], "classification": "Serious" }
    }
  }
  ```

---

## `us-counties-ref.json`

Reference table of all ~3,140 US counties — FIPS, name, state abbreviation, centroid lat/lng, area, and population. Used as the seed list for national intelligence pipeline runs (SCVI, CFCI).

- **Upstream:** US Census Bureau TIGER/Line county geometries + ACS 5-year population estimates.
- **Refresh cadence:** Annually — county boundaries and FIPS codes change rarely, but populations should be refreshed with each ACS 5-year release.
- **Generator:** No dedicated build script. Derived from Census TIGER API during initial setup.
- **Runtime client:** Referenced directly by `scripts/build-scvi-national.ts` and `scripts/build-cfci-national.ts` as the county seed list; not imported by the app at runtime.
- **Fields:**

  ```jsonc
  [
    {
      "fips": "06037",
      "name": "Los Angeles County",
      "stateAbbr": "CA",
      "lat": 34.32,
      "lng": -118.22,
      "areaSqMi": 4058.88,
      "population": 10014009
    }
  ]
  ```

---

## `census-tract-demographics.json`

ACS 5-year census tract demographics for ~16,861 tracts. Used by the redlining analysis pipeline to join demographic data to HOLC neighborhoods.

- **Upstream:** US Census Bureau ACS 5-year estimates, table B19013 (median income), B17001 (poverty), B02001 (race), B25034 (housing year built). Fetched via Census API.
- **Refresh cadence:** Annually — ACS 5-year releases in December each year.
- **Generator:** Produced as a side-effect of `scripts/build-redlining-data.ts`. Cached locally to avoid re-fetching 16K tract calls during redlining rebuilds.
- **Runtime client:** Not imported at runtime. Used only by the redlining build script and `scripts/build-cfci-national.ts`.
- **Known limitation:** Covers tracts that appeared in the HOLC crosswalk crosswalk + county centroids used during the build run. Does not cover all ~85,000 US census tracts.
- **Fields:**

  ```jsonc
  [
    {
      "geoid": "34013000100",
      "population": 4283,
      "medianIncome": 52400,
      "povertyPop": 612,
      "povertyUniverse": 4100,
      "white": 2100,
      "black": 800,
      "hispanic": 950,
      "totalRacePop": 4200,
      "totalHispanicPop": 1050,
      "totalHousingUnits": 1800,
      "pre1950Units": 720
    }
  ]
  ```

---

## `holc-crosswalk.json`

University of Richmond Mapping Inequality HOLC neighborhood → 2020 Census tract crosswalk. 44,413 records linking each 1930s-era HOLC-graded neighborhood area to the modern census tracts that overlap it (with overlap percentage and area).

- **Upstream:** University of Richmond Digital Scholarship Lab, Mapping Inequality project. GeoJSON at <https://raw.githubusercontent.com/americanpanorama/mapping-inequality-census-crosswalk/main/MIv3Areas_2020TractCrosswalk.geojson>
- **Refresh cadence:** The underlying HOLC maps are historical and do not change; the census-tract crosswalk is updated when Census tract boundaries change (every 10 years). Next update: 2030 Census tract boundaries.
- **Generator:** `scripts/build-redlining-data.ts` (step 1 — download and strip geometry from the GeoJSON).
- **Runtime client:** `lib/data-sources/holc-crosswalk.ts` — looked up by census tract GEOID to find HOLC grade context for the EJ layer of individual property reports (`/api/intelligence/holc`).
- **Known limitation:** Covers only the ~300 cities that HOLC mapped in the 1930s. Most rural counties and many smaller cities have no HOLC data.
- **Fields:**

  ```jsonc
  [
    {
      "area_id": 1234,
      "grade": "D",
      "city": "Newark",
      "state": "NJ",
      "GEOID": "34013000100",
      "pct_tract": 0.72,
      "calc_area": 0.18
    }
  ]
  ```

---

## `flood-by-county.json`

FEMA NFIP residential flood insurance penetration rates by county. 3,158 records covering all counties with NFIP data.

- **Upstream:** FEMA OpenFEMA API — `NfipResidentialPenetrationRates` endpoint at <https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates>. Single bulk download, not per-county.
- **Refresh cadence:** FEMA updates NFIP statistics quarterly. Rebuild when the `asOfDate` in the bundle is more than 6 months old.
- **Generator:** `scripts/build-flood-data.ts`
- **Refresh procedure:**

  ```bash
  npx tsx scripts/build-flood-data.ts
  ```

- **Runtime client:** `lib/intelligence/cfci-scorer.ts` reads this file during CFCI national pipeline runs. Not read at request time.
- **Fields:**

  ```jsonc
  [
    {
      "fips": "48245",
      "state": "TX",
      "county": "Jefferson County",
      "totalResStructures": 98234,
      "totalResStructuresSfha": 12400,
      "fer": 0.1263,
      "resContractsInForce": 3200,
      "resContractsInForceSfha": 1800,
      "resPenetrationRate": 0.0326,
      "resPenetrationRateSfha": 0.1452,
      "adaptationGap": 0.8548,
      "asOfDate": "2024-06-30"
    }
  ]
  ```

---

## `scvi-national.json`

Soil Contamination Vulnerability Index (SCVI) scores for all 3,140 US counties. SCVI = √(SVS × CPI) normalized 0–100 where SVS is Soil Vulnerability Score (SSURGO + NASA POWER + urban data gap) and CPI is Contamination Pressure Index (brownfields, Superfund, ECHO, TRI).

- **Upstream:** Live EPA and USDA API calls per county — EPA Brownfields, EPA FRS/SEMS (Superfund), EPA ECHO (regulated facilities), EPA TRI (toxic releases), USDA SSURGO (soil properties), NASA POWER (climate/erosivity). No single upstream file.
- **Refresh cadence:** Rebuild annually or after major ECHO/SSURGO data updates. Runtime: ~2–4 hours for all 3,140 counties.
- **Generator:** `scripts/build-scvi-national.ts` (reads `data/us-counties-ref.json` as seed list)
- **Refresh procedure:**

  ```bash
  npx tsx scripts/build-scvi-national.ts
  # Logs to /tmp/scvi-national-run.log and data/scvi-build/
  # Failed counties are checkpointed to data/scvi-build/failed-counties.json
  ```

- **Known limitations:** SSURGO has no data for urban areas (they are excluded from soil surveys). Counties with many urban areas receive urban-data-gap penalties. EPA Brownfields and FRS SEMS APIs occasionally return 503; the build script retries but some counties may have degraded soil/Superfund scores.
- **Fields:**

  ```jsonc
  [
    {
      "fips": "06037",
      "county": "Los Angeles County",
      "state": "CA",
      "population": 10014009,
      "scvi": 72.4,
      "svs": 68.1,
      "cpi": 77.3,
      "quartile": 4,
      "usdaSviClass": "HIGH",
      "svsComponents": { "organicMatter": 45, "drainage": 60, "erosivity": 72 },
      "cpiComponents": { "brownfields": 80, "superfund": 55, "echo": 88, "tri": 70 },
      "coverage": { "ssurgo": "present", "brownfields": "present" },
      "samplePoints": 12,
      "demographics": { "medianIncome": 68044, "povertyRate": 15.8, "pctWhite": 26.1, "pctBlack": 8.0, "pctHispanic": 48.5 }
    }
  ]
  ```

---

## `cfci-national.json`

Compound Flood-Contamination Index (CFCI) scores for 3,131 US counties. CFCI = √(FloodExposureScore × CPI) normalized 0–100, fusing FEMA NFIP residential SFHA penetration rates with the SCVI contamination-pressure sub-score.

- **Upstream:** Derived entirely from `data/scvi-national.json` (CPI sub-scores) and `data/flood-by-county.json` (FEMA NFIP penetration rates). No external API calls at build time.
- **Refresh cadence:** Rebuild whenever `scvi-national.json` or `flood-by-county.json` is updated.
- **Generator:** `scripts/build-cfci-national.ts`
- **Refresh procedure:**

  ```bash
  # Prerequisite: scvi-national.json and flood-by-county.json must be current
  npx tsx scripts/build-cfci-national.ts
  ```

- **Fields:**

  ```jsonc
  [
    {
      "fips": "22099",
      "county": "St. Mary Parish",
      "state": "LA",
      "population": 50200,
      "cfci": 81.3,
      "cfciQuartile": 4,
      "classification": "Q4_HIGH_BOTH",
      "floodExposureScore": 88.2,
      "fer": 0.62,
      "cpi": 74.5,
      "scvi": 69.8,
      "totalResStructures": 22100,
      "totalResStructuresSfha": 13700,
      "resPenetrationRateSfha": 0.31,
      "adaptationGap": 0.69,
      "cpiComponents": { "brownfields": 70, "superfund": 55, "echo": 80, "tri": 68 },
      "demographics": { "medianIncome": 42500, "povertyRate": 22.1 },
      "floodAsOfDate": "2024-06-30"
    }
  ]
  ```

---

## `redlining-analysis.json`

300-city redlining analysis linking 1930s HOLC grades to present-day demographics and environmental contamination. Covers 9,036 HOLC neighborhoods across cities that were graded by the Home Owners' Loan Corporation.

- **Upstream:** Derived from `data/holc-crosswalk.json` (HOLC neighborhoods), `data/census-tract-demographics.json` (ACS demographics), `data/scvi-national.json` and `data/cfci-national.json` (county environmental scores). No external API calls at build time.
- **Refresh cadence:** Rebuild after updating any of the three upstream bundles.
- **Generator:** `scripts/build-redlining-data.ts`
- **Refresh procedure:**

  ```bash
  # Prerequisite: holc-crosswalk.json, census-tract-demographics.json,
  # scvi-national.json, cfci-national.json must all be current
  npx tsx scripts/build-redlining-data.ts
  ```

- **Runtime client:** Read by `/app/intelligence/redlining/page.tsx` (server component) and `/api/intelligence/holc` endpoint for individual report EJ layer context.
- **Fields:**

  ```jsonc
  {
    "meta": { "generatedAt": "...", "neighborhoodCount": 9036, "cityCount": 300 },
    "nationalStats": { "byGrade": { "A": { "medianIncome": 85000 }, "D": { "medianIncome": 42000 } } },
    "cityGaps": [...],
    "topCitiesByPovertyGap": [...],
    "topCitiesByHousingAgeGap": [...],
    "topCitiesByRacialGap": [...],
    "neighborhoods": [
      {
        "areaId": 1234,
        "grade": "D",
        "city": "Newark",
        "state": "NJ",
        "tracts": ["34013000100"],
        "population": 4283,
        "medianIncome": 38500,
        "povertyRate": 28.4,
        "pctWhite": 12.1,
        "pctBlack": 68.3,
        "pctHispanic": 15.2,
        "pre1950HousingPct": 72.5,
        "countyFips": "34013",
        "scvi": 62.1,
        "cpi": 71.0,
        "cfci": 38.4
      }
    ]
  }
  ```

---

## `scvi-nj-pilot.json`

SCVI scores for 21 New Jersey counties — the initial pilot run used to validate the SCVI pipeline before the full national build.

- **Upstream:** Same sources as `scvi-national.json` (SSURGO, NASA POWER, EPA Brownfields, FRS SEMS, ECHO, TRI), scoped to NJ counties only.
- **Refresh cadence:** Superseded by `scvi-national.json`. No need to refresh independently.
- **Generator:** `scripts/build-scvi-nj-pilot.ts`
- **Runtime client:** Not used by the app. Retained for historical reference.
- **Fields:** Same schema as `scvi-national.json` without the `demographics` field.

---

## Adding a new bundle

1. Write a generator under `scripts/build-<source>-data.ts` that:
   - Reads the raw upstream file from a documented path
   - Normalizes units, dates, and column names
   - Writes a single JSON file to `data/<source>-by-<key>.json`
   - Records `generatedAt` and an upstream-release-date field for staleness
     checking
2. Write a runtime client under `lib/data-sources/<source>.ts` that lazily
   loads the bundle via `fs.readFileSync` and exposes typed lookups.
3. Add a stale-bundle warning in the client when the upstream-release-date
   field is older than one full refresh cycle.
4. Add test-only hooks (`__set<name>BundleForTests`, `__reset<name>BundleCache`)
   so unit tests can inject fixtures without touching the filesystem.
5. Document the refresh procedure in a new section of this file.

Data bundles should be as small as the upstream allows — strip fields we
don't use, round concentrations to reasonable precision, and skip rows that
will never be queried. The UCMR 5 bundle is ~1.5 MB after this treatment,
down from a ~300 MB source file.
