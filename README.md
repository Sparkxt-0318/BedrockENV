# BedrockENV

Environmental exposure assessment platform. Given a US address, Bedrock returns a
composite exposure score (0-100) aggregated from 15 federal data sources across
five layers: water contamination, air quality, toxic proximity, soil & land, and
environmental justice.

Built on Next.js 16 (App Router, Turbopack) with TypeScript strict mode.

## Features

- **Five-layer scoring engine** (v4) — Water 25%, Air 25%, Proximity 20%, Soil 15%, EJ 15%
- **15 federal data sources** — EPA (SDWIS, UCMR 5, ECHO, FRS, EJScreen, Brownfields, TRI, AQS, Green Book), USDA (SSURGO), Census (ACS B25034), FEMA (NFHL), NASA (POWER), CDC (SVI)
- **Editorial showcase report** — scrollytelling layout with animated score rings, sticky sidebar, per-layer data chapters with source citations
- **AI narrative** — Claude-generated plain-English summary (describes data, never prescribes)
- **PDF report** — @react-pdf/renderer multi-page PDF with cover, executive summary, layer pages, recommendations, and methodology
- **Stripe payments** — $29 single-report purchase, $99/mo Pro subscription, free preview with frosted blur paywall
- **Coverage honesty** — distinguishes "clean data" from "no monitoring infrastructure"

## Getting Started

```bash
pnpm install
cp .env.example .env.local    # fill in your keys
pnpm dev
```

Open <http://localhost:3000> in your browser.

## Development workflow

```bash
pnpm qa          # build + typecheck + lint + unit tests + integration smoke
pnpm test        # vitest unit tests only (298 tests)
pnpm build       # production build
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Set all environment variables from `.env.example` in the Vercel project settings.
4. Build command: `pnpm build` | Output directory: `.next`
5. Set the Stripe webhook endpoint to `https://<your-domain>/api/webhooks/stripe`.
6. Deploy.

### Required environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (webhooks, admin ops) |
| `ANTHROPIC_API_KEY` | Claude API for narrative generation |
| `STRIPE_SECRET_KEY` | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_CONSUMER_REPORT_PRICE_ID` | Stripe price ID for $29 report |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for $99/mo subscription |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL token for maps |
| `CENSUS_API_KEY` | Census Bureau API key |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (for redirects) |

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
