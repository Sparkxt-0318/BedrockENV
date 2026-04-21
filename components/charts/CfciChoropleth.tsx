'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoJsonProperties, FeatureCollection, GeometryObject, Feature, MultiLineString } from 'geojson';

type ViewMode = 'cfci' | 'flood' | 'cpi';

interface CountyRecord {
  fips: string;
  county: string;
  state: string;
  population: number;
  cfci: number;
  cfciQuartile: number;
  classification: string;
  floodExposureScore: number;
  fer: number;
  cpi: number;
  totalResStructuresSfha: number;
  totalResStructures: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
}

interface Props {
  data: CountyRecord[];
}

const CFCI_COLORS = ['#40916C', '#A7C957', '#F4C430', '#E07A2F', '#C23B22'] as const;

function getColorScale(mode: ViewMode) {
  if (mode === 'cfci') return d3.scaleQuantize<string>().domain([0, 50]).range(CFCI_COLORS);
  if (mode === 'flood') return d3.scaleQuantize<string>().domain([0, 60]).range(CFCI_COLORS);
  return d3.scaleQuantize<string>().domain([0, 100]).range(CFCI_COLORS);
}

function getCountyColor(
  r: CountyRecord | undefined,
  mode: ViewMode,
  scale: d3.ScaleQuantize<string, never>
): string {
  if (!r) return '#E2DDD6';
  const val = mode === 'cfci' ? r.cfci : mode === 'flood' ? r.floodExposureScore : r.cpi;
  return scale(val) ?? '#E2DDD6';
}

export function CfciChoropleth({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>('cfci');
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
              <div>CFCI: <strong>${r.cfci}</strong> (${r.classification})</div>
              <div>Flood exposure: ${(r.fer * 100).toFixed(0)}% in SFHA</div>
              <div>Contamination (CPI): ${r.cpi}</div>
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
    { key: 'cfci', label: 'CFCI' },
    { key: 'flood', label: 'Flood Exposure' },
    { key: 'cpi', label: 'Contamination (CPI)' },
  ];

  const legendLabels: Record<ViewMode, [string, string]> = {
    cfci: ['Low compound risk', 'Severe'],
    flood: ['No SFHA', '60%+ in SFHA'],
    cpi: ['Clean', 'Heavy'],
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-3 flex-wrap">
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
          aria-label="US county choropleth map of compound flood-contamination risk"
        />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity bg-bg-elevated border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm z-20 shadow-md max-w-[220px]"
          style={{ top: 0, left: 0 }}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-text-secondary">{legendLabels[mode][0]}</span>
        <div className="flex h-3 flex-1 rounded-sm overflow-hidden">
          {CFCI_COLORS.map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] text-text-secondary">{legendLabels[mode][1]}</span>
      </div>
    </div>
  );
}
