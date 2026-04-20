'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoJsonProperties, FeatureCollection, GeometryObject, Feature, MultiLineString } from 'geojson';

type ViewMode = 'scvi' | 'svs' | 'cpi' | 'usdaSvi';

interface CountyRecord {
  fips: string;
  county: string;
  state: string;
  population: number;
  scvi: number;
  svs: number;
  cpi: number;
  quartile: number;
  usdaSviClass: string;
}

interface ScviChoroplethProps {
  data: CountyRecord[];
}

const SCVI_COLORS = ['#40916C', '#A7C957', '#F4C430', '#E07A2F', '#C23B22'] as const;
const SVI_CLASS_COLORS: Record<string, string> = {
  'Very Low': '#40916C',
  Low: '#52B788',
  Moderate: '#F4C430',
  'Moderately High': '#E07A2F',
  High: '#C23B22',
  'Very High': '#8B1A1A',
};

function getColorScale(mode: ViewMode) {
  if (mode === 'usdaSvi') return null;
  return d3.scaleQuantize<string>().domain([0, 100]).range(SCVI_COLORS);
}

function getCountyColor(r: CountyRecord | undefined, mode: ViewMode, scale: d3.ScaleQuantize<string, never> | null): string {
  if (!r) return '#E2DDD6';
  if (mode === 'usdaSvi') return SVI_CLASS_COLORS[r.usdaSviClass] ?? '#E2DDD6';
  const val = mode === 'scvi' ? r.scvi : mode === 'svs' ? r.svs : r.cpi;
  return scale?.(val) ?? '#E2DDD6';
}

export function ScviChoropleth({ data }: ScviChoroplethProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>('scvi');
  const [loading, setLoading] = useState(true);
  const topoRef = useRef<Topology | null>(null);
  const dataMapRef = useRef<Map<string, CountyRecord>>(new Map());

  useEffect(() => {
    const m = new Map<string, CountyRecord>();
    for (const r of data) m.set(r.fips, r);
    dataMapRef.current = m;
  }, [data]);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const topo = topoRef.current;
    if (!topo || !svgRef.current) return;

    const counties = feature(
      topo,
      topo.objects.counties as GeometryCollection
    ) as FeatureCollection<GeometryObject, GeoJsonProperties>;
    const statesMesh = mesh(
      topo,
      topo.objects.states as GeometryCollection,
      (a, b) => a !== b
    ) as unknown as MultiLineString;

    const scale = getColorScale(mode);
    const dm = dataMapRef.current;
    const path = d3.geoPath();

    svg.selectAll('*').remove();

    const g = svg.append('g');

    type CountyFeature = Feature<GeometryObject, GeoJsonProperties>;

    g.selectAll<SVGPathElement, CountyFeature>('path.county')
      .data(counties.features)
      .join('path')
      .attr('class', 'county')
      .attr('d', (d) => path(d) ?? '')
      .attr('fill', (d) => getCountyColor(dm.get(d.id as string), mode, scale))
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 0.3)
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('stroke', 'var(--text-primary)').attr('stroke-width', 1.5).raise();
        const r = dm.get(d.id as string);
        const tooltip = tooltipRef.current;
        if (tooltip && r) {
          tooltip.style.opacity = '1';
          tooltip.innerHTML = `
            <div class="font-medium">${r.county}, ${r.state}</div>
            <div class="text-xs mt-1 space-y-0.5">
              <div>SCVI: <strong>${r.scvi}</strong> (Q${r.quartile})</div>
              <div>SVS: ${r.svs} · CPI: ${r.cpi}</div>
              <div>USDA SVI: ${r.usdaSviClass}</div>
              <div>Pop: ${r.population.toLocaleString()}</div>
            </div>
          `;
        }
      })
      .on('mousemove', function (event) {
        const tooltip = tooltipRef.current;
        if (tooltip) {
          const rect = svgRef.current!.getBoundingClientRect();
          let left = event.clientX - rect.left + 12;
          let top = event.clientY - rect.top - 10;
          if (left + 220 > rect.width) left = event.clientX - rect.left - 230;
          if (top < 0) top = 4;
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', 'var(--border)').attr('stroke-width', 0.3);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      })
      .on('click', (_event, d) => {
        const r = dm.get(d.id as string);
        if (r) {
          window.location.href = `/report/search?address=${encodeURIComponent(`${r.county} County, ${r.state}`)}`;
        }
      })
      .style('cursor', 'pointer');

    g.append('path')
      .datum(statesMesh)
      .attr('fill', 'none')
      .attr('stroke', 'var(--border-strong)')
      .attr('stroke-width', 1)
      .attr('d', path(statesMesh) ?? '')
      .attr('pointer-events', 'none');
  }, [mode]);

  useEffect(() => {
    fetch('/counties-albers-10m.json')
      .then((r) => r.json())
      .then((topo: Topology) => {
        topoRef.current = topo;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading) draw();
  }, [loading, draw]);

  const modes: { key: ViewMode; label: string }[] = [
    { key: 'scvi', label: 'SCVI' },
    { key: 'svs', label: 'SVS' },
    { key: 'cpi', label: 'CPI' },
    { key: 'usdaSvi', label: 'USDA SVI' },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-3">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
              mode === m.key
                ? 'bg-accent text-white'
                : 'bg-bg-elevated text-text-primary/70 hover:text-text-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-surface">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-surface z-10">
            <div className="text-sm text-text-tertiary">Loading map…</div>
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox="0 0 975 610"
          className="w-full h-auto"
          aria-label="US county choropleth map of SCVI scores"
        />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity bg-bg-elevated border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm z-20 shadow-md max-w-[220px]"
          style={{ top: 0, left: 0 }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        {mode === 'usdaSvi' ? (
          Object.entries(SVI_CLASS_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-[10px] text-text-secondary">{label}</span>
            </div>
          ))
        ) : (
          <>
            <span className="text-[10px] text-text-secondary">Low</span>
            <div className="flex h-3 flex-1 rounded-sm overflow-hidden">
              {SCVI_COLORS.map((c) => (
                <div key={c} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <span className="text-[10px] text-text-secondary">High</span>
          </>
        )}
      </div>
    </div>
  );
}
