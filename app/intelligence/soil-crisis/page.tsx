import type { Metadata } from 'next';
import Link from 'next/link';
import { Display, Body, Label, Mono } from '@/components/ui/Type';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'National Soil Contamination Analysis | Bedrock Intelligence',
  description:
    'County-level soil contamination vulnerability index across all US counties.',
};

export default function SoilCrisisPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-8"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Intelligence
      </Link>

      <div className="mb-12">
        <Display className="text-4xl mb-4">
          National Soil Contamination Vulnerability Index
        </Display>
        <Body className="text-lg">
          Processing county-level environmental data across 3,140+ US counties
        </Body>
      </div>

      {/* Processing indicator */}
      <Card className="mb-8">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-20" />
            <span className="relative inline-flex h-5 w-5 rounded-full bg-accent/20 items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">
              Research in progress
            </p>
            <p className="text-sm text-text-secondary">
              Data processing began April 2026. Results will appear here
              automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Methodology note */}
      <section className="mb-12">
        <Label as="h2" className="mb-4 block">Methodology</Label>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              The Soil Contamination Vulnerability Index (SCVI) is a composite
              metric combining two core dimensions for each US county:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated">
                <Mono className="text-sm block mb-1">SVS</Mono>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Soil Vulnerability Score — derived from USDA SSURGO soil
                  properties including texture, drainage class, organic matter,
                  pH, and cation exchange capacity. Measures inherent
                  susceptibility to contaminant retention and transport.
                </p>
              </div>
              <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated">
                <Mono className="text-sm block mb-1">CPI</Mono>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Contamination Pressure Index — derived from EPA Brownfields
                  density, ECHO facility compliance, TRI release volumes, and
                  Superfund proximity. Measures anthropogenic contamination
                  pressure on county soils.
                </p>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-4">
              SCVI = SVS &times; CPI, normalized to a 0&ndash;100 scale.
              Counties are assigned to quartiles (Q1&ndash;Q4) where Q4
              represents the highest vulnerability.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Data scope */}
      <section>
        <Label as="h2" className="mb-4 block">Data Scope</Label>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center py-5">
              <Mono className="text-2xl block mb-1">3,140+</Mono>
              <p className="text-xs text-text-tertiary">US Counties</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-5">
              <Mono className="text-2xl block mb-1">15+</Mono>
              <p className="text-xs text-text-tertiary">Federal Sources</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-5">
              <Mono className="text-2xl block mb-1">Q2 2026</Mono>
              <p className="text-xs text-text-tertiary">Est. Completion</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
