import { Hero } from '@/components/landing/Hero';
import { LayerChapters } from '@/components/landing/LayerChapters';
import { DataSources } from '@/components/landing/DataSources';
import { CTAPro } from '@/components/landing/CTAPro';

export default function Home() {
  return (
    <>
      <Hero />
      <LayerChapters />
      <DataSources />
      <CTAPro />
    </>
  );
}
