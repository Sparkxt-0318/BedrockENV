import { Hero } from '@/components/landing/Hero';
import { ProblemStatement } from '@/components/landing/ProblemStatement';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DataSources } from '@/components/landing/DataSources';
import { CTAPro } from '@/components/landing/CTAPro';

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemStatement />
      <HowItWorks />
      <DataSources />
      <CTAPro />
    </>
  );
}
