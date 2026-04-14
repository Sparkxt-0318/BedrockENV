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
