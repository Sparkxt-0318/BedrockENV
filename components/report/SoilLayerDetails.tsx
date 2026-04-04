import { SoilLayerData } from '@/types/exposure';
import { RiskBadge, ResolutionBadge } from '@/components/ui';
import { formatDistance } from '@/lib/utils';

interface SoilLayerDetailsProps {
  data: SoilLayerData;
}

export function SoilLayerDetails({ data }: SoilLayerDetailsProps) {
  return (
    <div className="space-y-5 text-sm">
      {/* SSURGO Soil Properties */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">
          Soil Survey Data (USDA SSURGO)
        </h4>
        {data.ssurgo ? (
          <div className="space-y-2">
            <p className="text-text-secondary">
              Soil survey data for your area indicates <strong>{data.ssurgo.dominantTexture}</strong> soil
              in map unit &ldquo;{data.ssurgo.mapUnitName}&rdquo;.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SoilStat
                label="Texture"
                value={data.ssurgo.dominantTexture}
              />
              <SoilStat
                label="pH Range"
                value={
                  data.ssurgo.phRange[0] > 0
                    ? `${data.ssurgo.phRange[0].toFixed(1)} – ${data.ssurgo.phRange[1].toFixed(1)}`
                    : 'N/A'
                }
                note={getPhNote(data.ssurgo.phRange)}
              />
              <SoilStat
                label="Organic Matter"
                value={data.ssurgo.organicMatterPct > 0 ? `${data.ssurgo.organicMatterPct}%` : 'N/A'}
                note={getOmNote(data.ssurgo.organicMatterPct)}
              />
              <SoilStat
                label="Drainage"
                value={data.ssurgo.drainageClass || 'N/A'}
              />
            </div>
            {data.ssurgo.components.length > 1 && (
              <details className="mt-2">
                <summary className="text-xs text-accent cursor-pointer">
                  Soil components ({data.ssurgo.components.length})
                </summary>
                <div className="mt-2 space-y-1">
                  {data.ssurgo.components.map((c, i) => (
                    <div key={i} className="text-xs text-text-secondary">
                      {c.name} — {c.percentage}% of map unit, {c.horizons.length} horizon(s)
                    </div>
                  ))}
                </div>
              </details>
            )}
            <p className="text-xs text-text-tertiary mt-1">
              Source: USDA SSURGO Soil Survey, map unit {data.ssurgo.mapUnitKey}.
              Soil properties represent the dominant soil type in the map unit and may not reflect
              exact conditions at your specific property.
            </p>
          </div>
        ) : (
          <p className="text-text-tertiary">
            Soil survey data not available for this location.
          </p>
        )}
      </div>

      {/* Brownfield Proximity */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">
          Contaminated Site Proximity (EPA Brownfields)
        </h4>
        {data.brownfields.length > 0 ? (
          <div className="space-y-2">
            <p className="text-text-secondary">
              <strong>{data.brownfields.length}</strong> brownfield site(s) found within 2 miles.
            </p>
            <div className="space-y-2">
              {data.brownfields.slice(0, 5).map((site) => (
                <div
                  key={site.siteId}
                  className="flex items-start gap-3 px-3 py-2 rounded-[var(--radius-md)] bg-bg-elevated"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary text-xs">
                        {site.name}
                      </span>
                      <ResolutionBadge resolution="property" />
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatDistance(site.distance)} {site.direction} of your property
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Contaminants: {site.contaminantTypes.join(', ')} | Status: {site.cleanupStatus}
                    </p>
                  </div>
                  {site.distance < 0.5 && <RiskBadge tier="HIGH" />}
                  {site.distance >= 0.5 && site.distance < 1 && <RiskBadge tier="ELEVATED" />}
                  {site.distance >= 1 && <RiskBadge tier="MODERATE" />}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Source: EPA Brownfields Program. Proximity does not confirm contamination at your property.
            </p>
          </div>
        ) : (
          <p className="text-exposure-low">
            No brownfield sites found within 2 miles of your property.
          </p>
        )}
      </div>

      {/* Flood Zone */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">
          Flood Zone &amp; Contamination Mobilization Risk (FEMA)
        </h4>
        {data.floodZone ? (
          <div className="flex items-start gap-3">
            <RiskBadge tier={data.floodZone.riskLevel} />
            <div>
              <p className="text-text-secondary">
                Your property is in <strong>FEMA Flood Zone {data.floodZone.zone}</strong>
                {' — '}{data.floodZone.zoneDescription}.
                {data.floodZone.isSpecialFloodHazardArea && (
                  <span className="text-exposure-high font-medium">
                    {' '}This is a Special Flood Hazard Area.
                  </span>
                )}
              </p>
              {data.floodZone.isSpecialFloodHazardArea && data.brownfields.length > 0 && (
                <p className="text-text-secondary mt-2">
                  <strong>Compounded risk:</strong> Properties in flood zones near contamination
                  sources face elevated risk during flood events, as flooding can mobilize
                  contaminants from nearby sites into residential areas.
                </p>
              )}
              <p className="text-xs text-text-tertiary mt-1">
                Source: FEMA National Flood Hazard Layer (NFHL).
              </p>
            </div>
          </div>
        ) : (
          <p className="text-text-tertiary">
            Flood zone data not available for this location.
          </p>
        )}
      </div>

      {/* Soil Moisture / Precipitation */}
      {data.moistureData && (
        <div>
          <h4 className="font-medium text-text-primary mb-2">
            Precipitation &amp; Moisture (NASA POWER)
          </h4>
          <div className="flex items-start gap-3">
            <ResolutionBadge resolution="area" />
            <div>
              <p className="text-text-secondary">
                Average monthly precipitation for your region:{' '}
                <strong>{data.moistureData.precipitationAvgMm} mm</strong>.
                5-year trend: <strong>{data.moistureData.trend}</strong>.
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Source: NASA POWER API (~50km resolution). Used as a proxy for soil moisture conditions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SoilStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="p-2 rounded bg-bg-elevated">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="font-medium text-text-primary text-sm">{value}</p>
      {note && <p className="text-xs text-text-tertiary mt-0.5">{note}</p>}
    </div>
  );
}

function getPhNote(phRange: [number, number]): string | undefined {
  if (phRange[0] === 0) return undefined;
  const avg = (phRange[0] + phRange[1]) / 2;
  if (avg >= 6.0 && avg <= 7.0) return 'Optimal range';
  if (avg < 5.5) return 'Acidic — may increase metal mobility';
  if (avg > 8.0) return 'Alkaline — may affect nutrient availability';
  return undefined;
}

function getOmNote(omPct: number): string | undefined {
  if (omPct <= 0) return undefined;
  if (omPct >= 3) return 'Healthy';
  if (omPct >= 1) return 'Below average';
  return 'Degraded';
}
