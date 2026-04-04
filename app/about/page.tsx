import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Bedrock is an AI-powered environmental exposure intelligence platform.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-text-primary mb-6">
        About Bedrock
      </h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-text-secondary leading-relaxed">
        <p className="text-lg">
          176 million Americans live in communities where drinking water has tested positive
          for PFAS. 9,728 contamination sites exist across 50 states. The EPA, USDA, NASA,
          USGS, FEMA, and Census Bureau all track environmental health data — but nobody
          connects it for you.
        </p>

        <p>
          Bedrock is the first platform to aggregate all major environmental exposure vectors
          into a single, address-level intelligence report. We scan 10+ federal databases to
          show you what contaminants affect your water, soil, air, and land — and we pair
          that data with expert-sourced action recommendations so you know what to do about it.
        </p>

        <h2 className="text-2xl font-semibold text-text-primary mt-10 mb-4">Our approach</h2>

        <p>
          Environmental data is complex. Bedrock makes it understandable without making it
          misleading. We follow three core principles:
        </p>

        <ul className="space-y-3">
          <li>
            <strong className="text-text-primary">Resolution transparency:</strong> We never present
            area-level data as property-level certainty. Every data point is tagged with its spatial
            resolution so you know exactly how confident to be.
          </li>
          <li>
            <strong className="text-text-primary">Deterministic recommendations:</strong> Our action
            recommendations come from expert-sourced decision trees, not AI generation. The AI
            describes your data in plain English; the recommendations come from regulatory sources.
          </li>
          <li>
            <strong className="text-text-primary">Source attribution:</strong> Every claim traces back
            to a specific federal dataset with a citation. We show our work.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-text-primary mt-10 mb-4">Who we serve</h2>

        <p>
          Bedrock serves anyone who wants to understand their environmental exposure — from
          homebuyers checking a potential purchase, to home inspectors adding environmental
          due diligence to their reports, to families who want to know what is in their
          water and soil.
        </p>
      </div>
    </div>
  );
}
