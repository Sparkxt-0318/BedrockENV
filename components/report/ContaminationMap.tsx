'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ExposureAssessment } from '@/types/exposure';
import { ContaminationMapFallback } from './map/ContaminationMapFallback';
import { MapLayerControls } from './map/MapLayerControls';
import { MapLegend } from './map/MapLegend';

interface ContaminationMapProps {
  assessment: ExposureAssessment;
}

type LayerVisibility = {
  brownfields: boolean;
  floodZone: boolean;
  waterSystem: boolean;
  superfund: boolean;
  echoFacilities: boolean;
};

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
    superfund: true,
    echoFacilities: true,
  });
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    : undefined;

  const { latitude, longitude } = assessment.address;
  const brownfields = useMemo(() => assessment.soilData?.brownfields ?? [], [assessment.soilData?.brownfields]);
  const floodZone = assessment.soilData?.floodZone;
  const waterData = assessment.waterData;
  const superfundSites = useMemo(() => assessment.proximityData?.superfundSites ?? [], [assessment.proximityData?.superfundSites]);
  const echoFacilities = useMemo(() => assessment.proximityData?.echoFacilities?.facilities ?? [], [assessment.proximityData?.echoFacilities?.facilities]);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Apply layer visibility changes to the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    for (const marker of markersRef.current) {
      const el = (marker as { getElement: () => HTMLElement }).getElement();
      if (el.dataset.layer === 'brownfield') el.style.display = layers.brownfields ? '' : 'none';
      if (el.dataset.layer === 'water') el.style.display = layers.waterSystem ? '' : 'none';
      if (el.dataset.layer === 'superfund') el.style.display = layers.superfund ? '' : 'none';
      if (el.dataset.layer === 'echo') el.style.display = layers.echoFacilities ? '' : 'none';
    }

    try {
      if (map.getLayer('flood-zone-fill')) {
        const vis = layers.floodZone ? 'visible' : 'none';
        map.setLayoutProperty('flood-zone-fill', 'visibility', vis);
        map.setLayoutProperty('flood-zone-border', 'visibility', vis);
        map.setLayoutProperty('flood-zone-label', 'visibility', vis);
      }
    } catch {
      // Layer may not exist yet
    }
  }, [layers, mapLoaded]);

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

          new mapboxgl.Marker({ color: '#2D6A4F' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>${assessment.address.normalized}</strong><br/>Score: ${assessment.compositeScore.score}/100`
              )
            )
            .addTo(map);

          if (floodZone) {
            const floodColor = floodZone.isSpecialFloodHazardArea
              ? 'rgba(59, 130, 246, 0.15)' : 'rgba(147, 197, 253, 0.1)';
            const borderColor = floodZone.isSpecialFloodHazardArea
              ? 'rgba(59, 130, 246, 0.5)' : 'rgba(147, 197, 253, 0.3)';

            const radiusKm = 0.8;
            const points = 64;
            const coords = [];
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * 2 * Math.PI;
              const lat2 = latitude + (radiusKm * Math.sin(angle) / 111.32);
              const lng2 = longitude + (radiusKm * Math.cos(angle) / (111.32 * Math.cos(latitude * Math.PI / 180)));
              coords.push([lng2, lat2]);
            }
            coords.push(coords[0]);

            map.addSource('flood-zone', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } },
            });
            map.addLayer({ id: 'flood-zone-fill', type: 'fill', source: 'flood-zone', paint: { 'fill-color': floodColor } });
            map.addLayer({ id: 'flood-zone-border', type: 'line', source: 'flood-zone', paint: { 'line-color': borderColor, 'line-width': 2, 'line-dasharray': [3, 2] } });
            map.addLayer({
              id: 'flood-zone-label', type: 'symbol', source: 'flood-zone',
              layout: { 'text-field': `Zone ${floodZone.zone}${floodZone.isSpecialFloodHazardArea ? ' (SFHA)' : ''}`, 'text-size': 11, 'text-offset': [0, -2], 'text-anchor': 'top' },
              paint: { 'text-color': '#3B82F6', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
            });
          }

          if (waterData && waterData.systemName !== 'Unknown') {
            const hasPfas = waterData.pfas && waterData.pfas.analytes.length > 0;
            const waterColor = hasPfas ? (waterData.pfas?.exceedsMcl ? '#E76F51' : '#F4A261') : '#40916C';
            const el = document.createElement('div');
            el.dataset.layer = 'water';
            el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${waterColor};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;`;
            el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`;
            const waterMarker = new mapboxgl.Marker({ element: el })
              .setLngLat([longitude + 0.003, latitude + 0.002])
              .setPopup(new mapboxgl.Popup().setHTML(
                `<strong>${waterData.systemName}</strong><br/>PWSID: ${waterData.systemId}<br/>` +
                (hasPfas ? `PFAS: ${waterData.pfas!.analytes.length} analyte(s) detected${waterData.pfas!.exceedsMcl ? '<br/><span style="color:#E76F51">Exceeds EPA MCL</span>' : ''}` : 'No PFAS detected') +
                `<br/>Violations: ${waterData.violations.length}`
              ))
              .addTo(map);
            markersRef.current.push(waterMarker);
          }

          for (const site of brownfields) {
            const color = site.distance < 0.5 ? '#E76F51' : site.distance < 1 ? '#F4A261' : '#E9C46A';
            const el = document.createElement('div');
            el.dataset.layer = 'brownfield';
            el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;`;
            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([site.longitude, site.latitude])
              .setPopup(new mapboxgl.Popup().setHTML(`<strong>${site.name}</strong><br/>${site.distance.toFixed(1)} mi ${site.direction}<br/>Status: ${site.cleanupStatus}`))
              .addTo(map);
            markersRef.current.push(marker);
          }

          for (const site of superfundSites) {
            const el = document.createElement('div');
            el.dataset.layer = 'superfund';
            el.style.cssText = `width:24px;height:24px;border-radius:4px;background:#C23B22;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;`;
            el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/><rect x="11" y="10" width="2" height="4"/><rect x="11" y="16" width="2" height="2"/></svg>`;
            const distMi = (site.distanceKm * 0.621371).toFixed(1);
            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([site.longitude, site.latitude])
              .setPopup(new mapboxgl.Popup().setHTML(`<strong>${site.name}</strong><br/>NPL Status: ${site.nplStatus}<br/>Distance: ${distMi} mi`))
              .addTo(map);
            markersRef.current.push(marker);
          }

          const sortedFacilities = [...echoFacilities].sort((a, b) => a.distance - b.distance).slice(0, 30);
          for (const fac of sortedFacilities) {
            const isTri = fac.programs.includes('TRI');
            const isSnc = fac.complianceStatus === 'Significant Violation';
            const color = isSnc ? '#E76F51' : isTri ? '#F4A261' : '#86807A';
            const size = isTri || isSnc ? 16 : 12;
            const el = document.createElement('div');
            el.dataset.layer = 'echo';
            el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.2);cursor:pointer;opacity:0.85;`;
            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([fac.longitude, fac.latitude])
              .setPopup(new mapboxgl.Popup().setHTML(`<strong>${fac.name}</strong><br/>Programs: ${fac.programs.join(', ')}<br/>Status: ${fac.complianceStatus}<br/>Distance: ${fac.distance.toFixed(1)} mi`))
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
  }, [token, latitude, longitude, brownfields, floodZone, waterData, superfundSites, echoFacilities, assessment]);

  if (!token) {
    return (
      <ContaminationMapFallback
        address={assessment.address}
        brownfieldCount={brownfields.length}
        superfundCount={superfundSites.length}
        echoCount={echoFacilities.length}
      />
    );
  }

  const hasWater = waterData != null && waterData.systemName !== 'Unknown';

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden">
      <div className="bg-bg-elevated px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-medium text-text-primary">Contamination Map</h3>
        <MapLayerControls
          layers={layers}
          onToggle={toggleLayer}
          showWaterSystem={hasWater}
          showBrownfields={brownfields.length > 0}
          showFloodZone={floodZone != null}
          showSuperfund={superfundSites.length > 0}
          showEchoFacilities={echoFacilities.length > 0}
        />
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
      <MapLegend
        layers={layers}
        showWaterSystem={hasWater}
        waterPfasExceedsMcl={waterData?.pfas?.exceedsMcl}
        waterHasPfas={(waterData?.pfas?.analytes?.length ?? 0) > 0}
        hasBrownfields={brownfields.length > 0}
        floodZone={floodZone}
        hasSuperfund={superfundSites.length > 0}
        hasEchoFacilities={echoFacilities.length > 0}
      />
    </div>
  );
}
