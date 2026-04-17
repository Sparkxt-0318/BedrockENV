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

## In Progress

- **EJ layer** — EJScreen + CDC SVI integration (requires external API access; EJ scores return 0* for all addresses currently)
- **Air API keys** — EPA AQS, OpenAQ v3, AirNow registration (user-managed; air layer at ~50% coverage without them)
- **Superfund static bundle** — ~1,300 active NPL sites with coordinates to supplement FRS SEMS API (addresses Picher/Tar Creek gap)
- **Rank-order calibration** — Integration tests for relative scoring (Newark vs Flint, South LA vs Flint) need tuning after EJ layer is live

## Considering

- **Historical contamination flag** — Special handling for abandoned/dissolved towns (Picher-class) where contamination predates monitoring infrastructure
- **RSEI cancer risk** — EPA Risk-Screening Environmental Indicators for air toxics cancer risk (would improve Port Arthur scoring)
- **CERCLIS/SEMS supplemental source** — Additional Superfund data beyond FRS facility records
- **Report PDF export** — Server-side PDF generation for Pro users
- **Mapbox layer visualization** — Interactive map showing Superfund sites, TRI facilities, flood zones overlaid on the report
- **Time-series trends** — Show how contamination levels have changed over time (SDWIS violation history, air quality trends)
- **Neighborhood comparison** — Compare scores across nearby census tracts or zip codes
- **Mobile app** — React Native wrapper for push notifications on data updates
