'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CountyDot {
  county: string;
  state: string;
  svs: number;
  cpi: number;
  scvi: number;
  population: number;
  quartile: number;
}

interface SvsVsCpiScatterProps {
  data: CountyDot[];
}

const SCVI_COLORS = ['#40916C', '#A7C957', '#F4C430', '#E07A2F', '#C23B22'] as const;

export function SvsVsCpiScatter({ data }: SvsVsCpiScatterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 420;
    const margin = { top: 20, right: 20, bottom: 50, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const colorScale = d3.scaleQuantize<string>().domain([0, 100]).range([...SCVI_COLORS]);
    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);
    const r = d3.scaleSqrt().domain([0, 1_000_000]).range([2, 12]).clamp(true);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5))
      .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick line').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').style('font-size', '11px'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick line').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').style('font-size', '11px'));

    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '12px')
      .style('font-family', 'var(--font-sans)')
      .text('Soil Vulnerability Score (SVS) →');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '12px')
      .style('font-family', 'var(--font-sans)')
      .text('Contamination Pressure (CPI) →');

    const sorted = [...data].sort((a, b) => b.population - a.population);

    g.selectAll<SVGCircleElement, CountyDot>('circle')
      .data(sorted)
      .join('circle')
      .attr('cx', (d) => x(d.svs))
      .attr('cy', (d) => y(d.cpi))
      .attr('r', (d) => r(d.population))
      .attr('fill', (d) => colorScale(d.scvi))
      .attr('fill-opacity', 0.6)
      .attr('stroke', (d) => colorScale(d.scvi))
      .attr('stroke-opacity', 0.9)
      .attr('stroke-width', 0.5)
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 2);
        const tip = tooltipRef.current;
        if (tip) {
          tip.style.opacity = '1';
          tip.innerHTML = `<strong>${d.county}, ${d.state}</strong><br/>SCVI: ${d.scvi} · SVS: ${d.svs} · CPI: ${d.cpi}<br/>Pop: ${d.population.toLocaleString()}`;
        }
      })
      .on('mousemove', function (event) {
        const tip = tooltipRef.current;
        if (tip) {
          const rect = svgRef.current!.getBoundingClientRect();
          tip.style.left = `${event.clientX - rect.left + 12}px`;
          tip.style.top = `${event.clientY - rect.top - 10}px`;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.6).attr('stroke-width', 0.5);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      })
      .style('cursor', 'pointer');
  }, [data]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-auto" aria-label="SVS vs CPI scatter plot" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity bg-bg-elevated border border-border rounded-[var(--radius-md)] px-3 py-2 text-xs z-20 shadow-md max-w-[240px]"
      />
    </div>
  );
}
