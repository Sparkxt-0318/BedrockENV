# EPA AQS — Air Quality System

## What it covers
EPA's definitive reference-grade air quality measurement database, covering PM2.5, PM10, ozone (O3), NO2, SO2, CO, and lead from over 4,000 monitoring stations nationwide operated by state and local agencies. AQS data is used to set NAAQS (National Ambient Air Quality Standards) and is the authoritative source for regulatory compliance decisions.

## What it doesn't cover
- Areas without AQS monitoring stations (large coverage gaps in rural areas)
- Real-time data (AQS data can lag by 1-2 months for quality-controlled data)
- Indoor air quality
- Non-criteria air pollutants (VOCs, HAPs — use TRI for facility-level HAP data)

## How Bedrock uses it
Live radius query in `lib/data-sources/epa-aqs.ts`. Returns PM2.5 annual mean and ozone fourth-highest value from the nearest AQS station. Complements OpenAQ data for the air layer.

**Requires API key**: EPA AQS API requires registration for an API key. Without a key, this source returns no data.

## Refresh cadence
Live API — annual mean values updated quarterly; final quality-controlled data typically available 6-12 months after the measurement period.

## Known limitations
- Requires API key registration (EPA AQS requires account approval)
- Coverage biased toward urban areas; many rural counties have no AQS station within reasonable radius
- Data lag: the most recent QC'd annual data may be 1-2 years old

## Source
EPA AQS: https://www.epa.gov/aqs
EPA AQS API: https://aqs.epa.gov/aqsweb/documents/data_api.html
