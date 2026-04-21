'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HolcData {
  grade: string;
  city: string;
  state: string;
  areaId: number;
  pctTract: number;
}

interface Props {
  censusTract: string;
}

const GRADE_META: Record<string, { color: string; label: string; dot: string }> = {
  A: { color: '#4daf4a', label: 'Best', dot: 'bg-[#4daf4a]' },
  B: { color: '#377eb8', label: 'Still Desirable', dot: 'bg-[#377eb8]' },
  C: { color: '#ffbf00', label: 'Declining', dot: 'bg-[#ffbf00]' },
  D: { color: '#e41a1c', label: 'Hazardous (Redlined)', dot: 'bg-[#e41a1c]' },
};

export function HolcContext({ censusTract }: Props) {
  const [data, setData] = useState<HolcData | null>(null);

  useEffect(() => {
    if (!censusTract || censusTract.length < 11) return;
    let cancelled = false;

    fetch(`/api/intelligence/holc?tract=${censusTract}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        if (body?.data) setData(body.data as HolcData);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [censusTract]);

  if (!data) return null;

  const meta = GRADE_META[data.grade];
  if (!meta) return null;

  return (
    <aside
      className="mt-10 rounded-[var(--radius-lg)] border border-border bg-bg-surface p-6"
      style={{ borderLeftWidth: 4, borderLeftColor: meta.color }}
      aria-label="Historical redlining context"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-text-tertiary">
            Historical context · HOLC 1935–1940
          </div>
          <h4 className="mt-1 text-lg font-medium text-text-primary">
            {data.city}, {data.state}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${meta.dot}`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium" style={{ color: meta.color }}>
            Grade {data.grade} — &ldquo;{meta.label}&rdquo;
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-text-secondary leading-relaxed">
        This address is in a census tract that overlaps a neighborhood classified as{' '}
        <strong className="text-text-primary">
          Grade {data.grade} (&ldquo;{meta.label}&rdquo;)
        </strong>{' '}
        by the Home Owners&apos; Loan Corporation in the 1930s.
        {data.grade === 'D' && (
          <> Redlined neighborhoods were systematically denied mortgage lending for
          decades, leading to chronic disinvestment in housing, infrastructure, and
          environmental remediation.</>
        )}
        {data.grade === 'C' && (
          <> HOLC classified these neighborhoods as &ldquo;Definitely Declining,&rdquo;
          limiting access to federally-backed mortgages.</>
        )}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <Link
          href="/intelligence/redlining"
          className="text-accent hover:underline"
        >
          View the national redlining analysis →
        </Link>
        <span className="font-[family-name:var(--font-mono)] text-text-tertiary">
          U. Richmond Mapping Inequality · Census ACS 2022
        </span>
      </div>
    </aside>
  );
}
