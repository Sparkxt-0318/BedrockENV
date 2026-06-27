# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil physical and chemical properties for the surface horizon (0–25 cm) at a
query point, via the USDA Soil Data Access (SDA) tabular web service.
Queried properties: texture (sand/silt/clay %), pH, organic matter %, CEC,
hydraulic conductivity (Ksat), drainage class, hydrologic group.

Results are aggregated across soil map unit components weighted by component
percentage (`comppct_r`), and across horizons weighted by intersected thickness
in the 0–25 cm band.

Data resolution: neighborhood-level (soil map unit, typically 1–100 acres).
Cache: 90 days (SSURGO updates annually).

## What it does NOT cover
- **Dense urban areas** — SSURGO has an "urban land" data gap. Mapped as
  "miscellaneous area" (compkind = 'Miscellaneous area'), which carries no soil
  chemistry. Urban soil properties (lead, contaminants, fill material) are not
  captured. This is a known and significant limitation for our urban user base.
- Soil contamination from industrial use (SSURGO is natural soil mapping, not
  contaminated land inventory)
- Subsurface horizons below 25 cm (relevant for deep contaminant transport)
- Recently disturbed soils (construction fill, mine spoil) may be classified
  inaccurately

## Refresh cadence
SSURGO is updated annually (typically October release). The SDA service is
queried live at assessment time. Check USDA Web Soil Survey for current vintage.
WKT coordinate order in SDA queries is (longitude, latitude) — swapping silently
returns zero rows.

## Known limitations
- Urban land gap: the majority of urban parcels return `coverage: 'partial'`
  (intersection found, all-null chemistry) or `coverage: 'unmapped'`, artificially
  suppressing soil scores for the highest-risk urban addresses
- SDA accepts SQL-like queries but is not a standard SQL endpoint — the
  `SDA_Get_Mukey_from_intersection_with_WktWgs84` function is proprietary
- API can be slow (3–8s) under load; timeout configured at 15s
- Aggregation to 0–25 cm band may miss contaminant transport in deeper horizons

## Layer assignment
Soil layer — soil chemistry component.
Also used in SCVI (Soil Contamination Vulnerability Index) national map.
