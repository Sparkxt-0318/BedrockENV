'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ExposureAssessment } from '@/types/exposure';

interface ContaminationMapProps {
  assessment: ExposureAssessment;
}

type LayerVisibility = {
  brownfields: boolean;
  floodZone: boolean;
  waterSystem: boolean;
};

/**
 * Contamination Map using Mapbox GL JS.
 * Shows the property location with toggleable overlay layers:
 * - Water: water system boundaries with PFAS detection markers
 * - Soil: brownfield locations + flood zones
 *
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN to be set.
 * Falls back gracefully to a static display when token is missing.
 */
export function ContaminationMap({ assessment }: ContaminationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markersRef = useRef<unknown[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState<LayerVisibility>({
    brownfields: true,
    floodZone: true,
    waterSystem: true,
  });
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    : undefined;

  const { latitude, longitude } = assessment.address;
  const brownfields = assessment.soilData?.brownfields ?? [];
  const floodZone = assessment.soilData?.floodZone;
  const waterData = assessment.waterData;

  // Toggle a layer
  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Apply layer visibility changes to the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Brownfield markers visibility
    for (const marker of markersRef.current) {
      const el = (marker as { getElement: () => HTMLElement }).getElement();
      if (el.dataset.layer === 'brownfield') {
        el.style.display = layers.brownfields ? '' : 'none';
      }
      if (el.dataset.layer === 'water') {
        el.style.display = layers.waterSystem ? '' : 'none';
      }
    }

    // Flood zone circle visibility
    try {
      if (map.getLayer('flood-zone-fill')) {
        map.setLayoutProperty('flood-zone-fill', 'visibility', layers.floodZone ? 'visible' : 'none');
      }
      if (map.getLayer('flood-zone-border')) {
        map.setLayoutProperty('flood-zone-border', 'visibility', layers.floodZone ? 'visible' : 'none');
      }
      if (map.getLayer('flood-zone-label')) {
        map.setLayoutProperty('flood-zone-label', 'visibility', layers.floodZone ? 'visible' : 'none');
      }
    } catch {
      // Layer may not exist yet
    }
  }, [layers, mapLoaded]);

  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        if (cancelled || !mapContainer.current) return;

        mapboxgl.accessToken = token!;

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [longitude, latitude],
          zoom: 13,
        });

        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          setMapLoaded(true);

          // === Property marker (always visible) ===
          new mapboxgl.Marker({ color: '#2D6A4F' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>${assessment.address.normalized}</strong><br/>Score: ${assessment.compositeScore.score}/100`
              )
            )
            .addTo(map);

          // === Flood zone overlay ===
          if (floodZone) {
            const floodColor = floodZone.isSpecialFloodHazardArea
              ? 'rgba(59, 130, 246, 0.15)' // blue tint for SFHA
              : 'rgba(147, 197, 253, 0.1)'; // lighter for non-SFHA
            const borderColor = floodZone.isSpecialFloodHazardArea
              ? 'rgba(59, 130, 246, 0.5)'
              : 'rgba(147, 197, 253, 0.3)';

            // Create a circle polygon approximation around the property
            const radiusKm = 0.8; // ~0.5 mile radius
            const points = 64;
            const coords = [];
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * 2 * Math.PI;
              const dx = radiusKm * Math.cos(angle);
              const dy = radiusKm * Math.sin(angle);
              const lat2 = latitude + (dy / 111.32);
              const lng2 = longitude + (dx / (111.32 * Math.cos(latitude * Math.PI / 180)));
              coords.push([lng2, lat2]);
            }
            coords.push(coords[0]); // close the polygon

            map.addSource('flood-zone', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Polygon', coordinates: [coords] },
              },
            });

            map.addLayer({
              id: 'flood-zone-fill',
              type: 'fill',
              source: 'flood-zone',
              paint: { 'fill-color': floodColor },
            });

            map.addLayer({
              id: 'flood-zone-border',
              type: 'line',
              source: 'flood-zone',
              paint: {
                'line-color': borderColor,
                'line-width': 2,
                'line-dasharray': [3, 2],
              },
            });

            // Flood zone label
            map.addLayer({
              id: 'flood-zone-label',
              type: 'symbol',
              source: 'flood-zone',
              layout: {
                'text-field': `Zone ${floodZone.zone}${floodZone.isSpecialFloodHazardArea ? ' (SFHA)' : ''}`,
                'text-size': 11,
                'text-offset': [0, -2],
                'text-anchor': 'top',
              },
              paint: {
                'text-color': '#3B82F6',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1,
              },
            });
          }

          // === Water system marker ===
          if (waterData && waterData.systemName !== 'Unknown') {
            const hasPfas = waterData.pfas && waterData.pfas.analytes.length > 0;
            const waterColor = hasPfas
              ? (waterData.pfas?.exceedsMcl ? '#E76F51' : '#F4A261')
              : '#40916C';

            // Place water system indicator near the property
            const waterMarkerEl = document.createElement('div');
            waterMarkerEl.dataset.layer = 'water';
            waterMarkerEl.style.cssText = `
              width: 28px; height: 28px; border-radius: 50%;
              background: ${waterColor}; border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
            `;
            waterMarkerEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`;

            const waterMarker = new mapboxgl.Marker({ element: waterMarkerEl })
              .setLngLat([longitude + 0.003, latitude + 0.002])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${waterData.systemName}</strong><br/>` +
                  `PWSID: ${waterData.systemId}<br/>` +
                  (hasPfas
                    ? `PFAS: ${waterData.pfas!.analytes.length} analyte(s) detected` +
                      (waterData.pfas!.exceedsMcl ? '<br/><span style="color:#E76F51">Exceeds EPA MCL</span>' : '')
                    : 'No PFAS detected') +
                  `<br/>Violations: ${waterData.violations.length}`
                )
              )
              .addTo(map);
            markersRef.current.push(waterMarker);
          }

          // === Brownfield markers ===
          for (const site of brownfields) {
            const color = site.distance < 0.5 ? '#E76F51' : site.distance < 1 ? '#F4A261' : '#E9C46A';

            const el = document.createElement('div');
            el.dataset.layer = 'brownfield';
            el.style.cssText = `
              width: 20px; height: 20px; border-radius: 50%;
              background: ${color}; border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              cursor: pointer;
            `;

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([site.longitude, site.latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${site.name}</strong><br/>${site.distance.toFixed(1)} mi ${site.direction}<br/>Status: ${site.cleanupStatus}`
                )
              )
              .addTo(map);
            markersRef.current.push(marker);
          }

          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        });
      } catch {
        setError('Could not load map');
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, [token, latitude, longitude, brownfields, floodZone, waterData, assessment]);

  // Inject Mapbox CSS
  useEffect(() => {
    if (!token) return;
    const id = 'mapbox-gl-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
    document.head.appendChild(link);
  }, [token]);

  // No Mapbox token — show static fallback
  if (!token) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden">
        <div className="bg-bg-elevated px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">Location Map</h3>
          <span className="text-xs text-text-tertiary">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
        <div className="h-64 flex items-center justify-center bg-bg-primary">
          <div className="text-center">
            <svg className="mx-auto mb-2 text-text-tertiary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-sm text-text-secondary">{assessment.address.normalized}</p>
            <p className="text-xs text-text-tertiary mt-1">
              Set NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive map
            </p>
            {brownfields.length > 0 && (
              <p className="text-xs text-text-secondary mt-2">
                {brownfields.length} brownfield site(s) within 2 miles
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden">
      <div className="bg-bg-elevated px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-medium text-text-primary">Contamination Map</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {waterData && waterData.systemName !== 'Unknown' && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={layers.waterSystem}
                onChange={() => toggleLayer('waterSystem')}
                className="rounded"
              />
              Water system
            </label>
          )}
          {brownfields.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={layers.brownfields}
                onChange={() => toggleLayer('brownfields')}
                className="rounded"
              />
              Brownfield sites
            </label>
          )}
          {floodZone && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={layers.floodZone}
                onChange={() => toggleLayer('floodZone')}
                className="rounded"
              />
              Flood zone
            </label>
          )}
        </div>
      </div>
      <div ref={mapContainer} className="h-72 sm:h-80">
        {!mapLoaded && !error && (
          <div className="h-full flex items-center justify-center bg-bg-primary">
            <p className="text-sm text-text-tertiary">Loading map...</p>
          </div>
        )}
        {error && (
          <div className="h-full flex items-center justify-center bg-bg-primary">
            <p className="text-sm text-text-tertiary">{error}</p>
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="px-4 py-2 border-t border-border flex flex-wrap gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-accent inline-block" /> Your property
        </span>
        {layers.waterSystem && waterData && waterData.systemName !== 'Unknown' && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{
              background: waterData.pfas?.exceedsMcl ? '#E76F51'
                : (waterData.pfas && waterData.pfas.analytes.length > 0) ? '#F4A261'
                : '#40916C'
            }} />
            Water system
          </span>
        )}
        {layers.brownfields && brownfields.length > 0 && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-exposure-high inline-block" /> &lt;0.5 mi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-exposure-elevated inline-block" /> 0.5–1 mi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-exposure-moderate inline-block" /> 1–2 mi
            </span>
          </>
        )}
        {layers.floodZone && floodZone && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block border border-blue-400" style={{ background: 'rgba(59,130,246,0.15)' }} />
            Flood Zone {floodZone.zone}
          </span>
        )}
      </div>
    </div>
  );
}
