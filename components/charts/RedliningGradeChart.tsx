'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: BarDatum[];
  format?: 'currency' | 'percent' | 'number';
  height?: number;
  ariaLabel?: string;
}

export function RedliningGradeChart({
  data,
  format = 'number',
  height = 240,
  ariaLabel = 'Bar chart',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const margin = { top: 16, right: 16, bottom: 32, left: format === 'currency' ? 60 : 46 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, w])
      .padding(0.35);

    const maxVal = d3.max(data, (d) => d.value) ?? 100;
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([h, 0]);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const fmt = (v: number) =>
      format === 'currency'
        ? `$${Math.round(v / 1000)}k`
        : format === 'percent'
          ? `${v.toFixed(1)}%`
          : `${Math.round(v)}`;

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x))
      .call((sel) => sel.select('.domain').attr('stroke', 'var(--border)'))
      .call((sel) => sel.selectAll('.tick line').remove())
      .call((sel) =>
        sel
          .selectAll('.tick text')
          .attr('fill', 'var(--text-tertiary)')
          .style('font-size', '13px')
          .style('font-weight', '600')
      );

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => fmt(d as number)))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('.tick line')
          .attr('x2', w)
          .attr('stroke', 'var(--border)')
          .attr('stroke-dasharray', '2,3')
      )
      .call((sel) =>
        sel
          .selectAll('.tick text')
          .attr('fill', 'var(--text-tertiary)')
          .style('font-size', '10px')
      );

    const safeY = (v: number) => Math.max(0, Math.min(h, y(Math.max(0, v))));

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.label)!)
      .attr('width', x.bandwidth())
      .attr('y', h)
      .attr('height', 0)
      .attr('rx', 3)
      .attr('fill', (d) => d.color)
      .transition()
      .duration(600)
      .delay((_, i) => i * 80)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => safeY(d.value))
      .attr('height', (d) => Math.max(0, h - safeY(d.value)));

    g.selectAll('.bar-label')
      .data(data)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => x(d.label)! + x.bandwidth() / 2)
      .attr('y', (d) => safeY(d.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '11px')
      .style('font-family', 'var(--font-mono)')
      .style('opacity', 0)
      .text((d) => fmt(d.value))
      .transition()
      .duration(400)
      .delay((_, i) => i * 80 + 400)
      .style('opacity', 1);
  }, [data, format, height]);

  return <svg ref={svgRef} className="w-full h-auto" aria-label={ariaLabel} />;
}
