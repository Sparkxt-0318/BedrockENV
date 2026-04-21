'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CfciRecord {
  fips: string;
  county: string;
  state: string;
  cfci: number;
  cfciQuartile: 1 | 2 | 3 | 4;
  classification: 'Low' | 'Elevated' | 'High' | 'Severe';
  floodExposureScore: number;
  fer: number;
  cpi: number;
  scvi: number;
  totalResStructuresSfha: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
}

interface Props {
  fipsState: string;
  fipsCounty: string;
}

const CLASSIFICATION_TONE: Record<
  CfciRecord['classification'],
  { dot: string; label: string }
> = {
  Low: { dot: 'bg-[#40916C]', label: 'text-[#2d6a4f]' },
  Elevated: { dot: 'bg-[#F4C430]', label: 'text-[#a8860a]' },
  High: { dot: 'bg-[#E07A2F]', label: 'text-[#b85a1a]' },
  Severe: { dot: 'bg-[#C23B22]', label: 'text-[#8c2414]' },
};

export function CfciCountyContext({ fipsState, fipsCounty }: Props) {
  const [record, setRecord] = useState<CfciRecord | null>(null);

  useEffect(() => {
    if (!fipsState || !fipsCounty) return;
    const fips = `${fipsState}${fipsCounty}`;
    let cancelled = false;

    fetch(`/api/intelligence/cfci?fips=${fips}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        if (body?.data) setRecord(body.data as CfciRecord);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [fipsState, fipsCounty]);

  if (!record) return null;

  const tone = CLASSIFICATION_TONE[record.classification];
  const uninsuredSfha = Math.round(
    record.totalResStructuresSfha * record.adaptationGap
  );

  return (
    <aside
      className="mt-10 rounded-[var(--radius-lg)] border border-border bg-bg-surface p-6"
      aria-label="County-level compound flood-contamination context"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-text-tertiary">
            County context · CFCI
          </div>
          <h4 className="mt-1 text-lg font-medium text-text-primary">
            {record.county} County, {record.state}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${tone.dot}`}
            aria-hidden="true"
          />
          <span className={`text-sm font-medium ${tone.label}`}>
            {record.classification} compound risk
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="font-[family-name:var(--font-mono)] text-2xl tabular-nums text-text-primary">
            {record.cfci}
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            CFCI score (0–100)
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] text-2xl tabular-nums text-text-primary">
            {(record.fer * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-xs text-text-secondary">Homes in SFHA</div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] text-2xl tabular-nums text-text-primary">
            {record.cpi}
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            Contamination (CPI)
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] text-2xl tabular-nums text-text-primary">
            {record.scvi}
          </div>
          <div className="mt-1 text-xs text-text-secondary">Soil vuln. (SCVI)</div>
        </div>
      </div>

      <p className="mt-5 text-sm text-text-secondary leading-relaxed">
        This county ranks in the{' '}
        <strong className="text-text-primary">
          {record.cfciQuartile === 4
            ? 'top'
            : record.cfciQuartile === 3
              ? 'third'
              : record.cfciQuartile === 2
                ? 'second'
                : 'lowest'}{' '}
          quartile
        </strong>{' '}
        nationally for combined flood exposure and contamination pressure.{' '}
        {uninsuredSfha > 0 && (
          <>
            An estimated{' '}
            <strong className="text-text-primary">
              {uninsuredSfha.toLocaleString()}
            </strong>{' '}
            residential structures sit in the FEMA Special Flood Hazard Area
            without NFIP coverage.
          </>
        )}
      </p>

      <div className="mt-5 flex items-center gap-4 text-xs">
        <Link
          href="/intelligence/flood-contamination"
          className="text-accent hover:underline"
        >
          View the national compound-risk map →
        </Link>
        <span className="font-[family-name:var(--font-mono)] text-text-tertiary">
          FEMA NFIP · EPA ECHO · USDA SSURGO
        </span>
      </div>
    </aside>
  );
}
