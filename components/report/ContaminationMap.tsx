'use client';

import { useRef, useEffect, useState } from 'react';
import { ExposureAssessment } from '@/types/exposure';

interface ContaminationMapProps {
  assessment: ExposureAssessment;
}

/**
 * Contamination Map using Mapbox GL JS.
 * Shows the property location with toggleable overlay layers for
 * brownfield sites and flood zones.
 *
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN to be set.
 * Falls back gracefully to a static display when token is missing.
 */
export function ContaminationMap({ assessment }: ContaminationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showBrownfields, setShowBrownfields] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    : undefined;

  const { latitude, longitude } = assessment.address;
  const brownfields = assessment.soilData?.brownfields ?? [];

  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        // CSS is loaded via link tag below

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

          // Property marker
          new mapboxgl.Marker({ color: '#2D6A4F' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>${assessment.address.normalized}</strong><br/>Score: ${assessment.compositeScore.score}/100`
              )
            )
            .addTo(map);

          // Brownfield markers
          for (const site of brownfields) {
            const color = site.distance < 0.5 ? '#E76F51' : site.distance < 1 ? '#F4A261' : '#E9C46A';
            new mapboxgl.Marker({ color, scale: 0.7 })
              .setLngLat([site.longitude, site.latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  `<strong>${site.name}</strong><br/>${site.distance.toFixed(1)} mi ${site.direction}<br/>Status: ${site.cleanupStatus}`
                )
              )
              .addTo(map);
          }

          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        });
      } catch {
        setError('Could not load map');
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, [token, latitude, longitude, brownfields, assessment]);

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
      <div className="bg-bg-elevated px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Contamination Map</h3>
        <div className="flex items-center gap-3">
          {brownfields.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showBrownfields}
                onChange={(e) => setShowBrownfields(e.target.checked)}
                className="rounded"
              />
              Brownfield sites
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
        {brownfields.length > 0 && showBrownfields && (
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
      </div>
    </div>
  );
}
