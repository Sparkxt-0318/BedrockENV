import type { Metadata } from 'next';
import Link from 'next/link';
import { IntelligenceClient } from './IntelligenceClient';

export const metadata: Metadata = {
  title: 'Environmental Intelligence | Bedrock',
  description:
    "Research briefs and analysis from Bedrock's environmental data platform.",
};

const briefs = [
  {
    number: 1,
    title: "America's Invisible Soil Crisis",
    stat: '3,140 counties',
    description:
      'County-level soil contamination vulnerability scores combining soil vulnerability with contamination pressure indicators.',
    image: 'chapter-soil',
    href: '/intelligence/soil-crisis',
  },
  {
    number: 2,
    title: 'Flood Meets Contamination',
    stat: '783 high-risk counties',
    description:
      'National map of counties where FEMA flood exposure intersects with EPA contamination pressure — the compound risk neither agency publishes.',
    image: 'chapter-flood',
    href: '/intelligence/flood-contamination',
  },
  {
    number: 3,
    title: 'Drawn in Red, Measured Today',
    stat: '300 cities analyzed',
    description:
      'Do neighborhoods redlined in the 1930s still have higher contamination today? A 300-city analysis linking HOLC maps to present-day demographics.',
    image: 'chapter-air',
    href: '/intelligence/redlining',
  },
];

const upcoming = [
  {
    title: 'Water System Risk Atlas',
    description:
      'Nationwide assessment of public water system risk factors including PFAS detection, violation history, and infrastructure age.',
  },
  {
    title: 'Air Quality Trends',
    description:
      'Multi-year analysis of PM2.5, ozone, and nonattainment trends at the county level.',
  },
];

export default function IntelligencePage() {
  return <IntelligenceClient briefs={briefs} upcoming={upcoming} />;
}
