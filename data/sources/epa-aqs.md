# EPA AQS — Air Quality System Data Mart

## What it covers
Annual historical air quality summaries from regulatory monitoring stations within 25 km. Covers PM2.5 (parameter `88101`) and ozone (parameter `44201`). Per-station: arithmetic mean, first maximum value, unit of measure, year, observation count, monitor site name, and coordinates. Derived: `pm25Annual` (highest arithmetic mean among PM2.5 monitors), `ozoneMax` (highest first-max ozone value).

## What it doesn't cover
- Current-year data (AQS is annual; queries target the prior completed calendar year)
- Locations with no monitor within 25 km
- Pollutants beyond PM2.5 and ozone (e.g. lead, NO2, SO2, CO)
- Real-time readings (use OpenAQ for near-real-time data)

## How it works
Live EPA AQS Data Mart API:
`https://aqs.epa.gov/data/api/annualData/byLatLng?email=…&key=…&param=88101,44201&bdate={year}0101&edate={year}1231&latitude=…&longitude=…&distance=25`
Requires `EPA_AQS_EMAIL` and `EPA_AQS_KEY` env vars (free registration at https://aqs.epa.gov/aqsweb/documents/data_api.html).
Default timeout: 8 s, no retry.

## Refresh cadence
Live API calls on every request. AQS data is annual; the query always targets the previous full calendar year. EPA typically finalizes prior-year data by spring of the following year.

## Known limitations
- Credentials required (`EPA_AQS_EMAIL` + `EPA_AQS_KEY`); gracefully skips with an error if absent
- Rate limited to approximately 5 requests/minute; 429 is passed through
- No fallback to earlier years if prior year has no monitors within 25 km
- Rural areas commonly have no monitors within 25 km
- Queries always the previous calendar year — will not reflect within-year improvements or deteriorations
