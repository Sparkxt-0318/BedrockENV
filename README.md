# BedrockENV

Environmental exposure assessment platform. Given an address, BedrockENV returns
a structured profile of likely exposures from public datasets — drinking-water
quality (EPA SDWIS, UCMR 5), housing-age lead risk (US Census ACS B25034), soil
characteristics (USDA SSURGO), nearby contamination (EPA Brownfields/FRS), flood
zone (FEMA NFHL), and climate proxies (NASA POWER).

The app is built on Next.js 16 (App Router) with TypeScript strict mode and is
designed to be transparent about data resolution: every result carries a source
label, a `cached` flag, and a `fetchedAt` timestamp so callers can reason about
freshness and provenance.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000> in your browser.

## Development workflow

```bash
pnpm qa          # lint + typecheck + unit tests + integration smoke
pnpm test        # vitest unit tests only
pnpm build       # production build
```

Most data-source clients live under `lib/data-sources/` and have matching unit
tests under `tests/unit/data-sources/`.

## Rebuilding the EPA UCMR 5 PFAS bundle

EPA does **not** expose UCMR 5 occurrence data through the Envirofacts REST
API. The only authoritative source is a quarterly ZIP published at
<https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule>.

To keep PFAS lookups fast and reliable, BedrockENV preprocesses the latest UCMR
5 release into a compact PWSID → analyte JSON bundle that ships with the repo
at `data/ucmr5-by-pwsid.json`. The runtime client (`lib/data-sources/epa-ucmr5.ts`)
loads the bundle once per process and answers queries in O(1).

EPA publishes new UCMR 5 data on a quarterly cycle (~90 days). The client logs
a console warning at startup when the bundle is more than 100 days old so an
outdated bundle does not silently underreport detections.

### Refresh procedure

1. Download the latest occurrence ZIP:

   ```bash
   curl -L -o /tmp/ucmr5-occurrence-data.zip \
     'https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip'
   ```

2. Note the EPA release date from the response's `Last-Modified` header
   (`curl -sI <url>`), then unzip the tab-delimited dump:

   ```bash
   mkdir -p /tmp/ucmr5_work
   unzip -d /tmp/ucmr5_work /tmp/ucmr5-occurrence-data.zip
   # The script reads /tmp/ucmr5_work/UCMR5_All.txt by default.
   ```

3. Regenerate the bundle, passing the EPA release date you captured:

   ```bash
   pnpm tsx scripts/build-ucmr5-data.ts --release-date YYYY-MM-DD
   ```

   The script writes `data/ucmr5-by-pwsid.json` and prints the row count,
   PWSID count, and recorded EPA release date.

4. Commit the regenerated `data/ucmr5-by-pwsid.json` alongside any code changes
   and verify `pnpm qa` is green.

If you omit `--release-date`, the script attempts a HEAD request against the
source URL to read `Last-Modified` automatically. Pass the flag explicitly when
running in network-restricted environments.
