import Link from 'next/link';
import { DuotoneImage } from '@/components/media/DuotoneImage';
import { Display, Label, Body } from '@/components/ui/Type';

interface BriefHeroProps {
  image: string;
  label: string;
  title: string;
  description: string;
  stats?: { value: string; label: string }[];
}

export function BriefHero({ image, label, title, description, stats }: BriefHeroProps) {
  return (
    <header className="relative min-h-[50vh] flex items-end overflow-hidden">
      <DuotoneImage
        src={image}
        alt=""
        intensity={0.78}
        className="absolute inset-0 h-full w-full"
        priority
      />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(13,31,28,0.97) 0%, rgba(13,31,28,0.5) 50%, transparent 100%)',
      }} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-32 sm:px-6 lg:px-8">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Intelligence
        </Link>

        <Label as="div" className="block mb-3 !text-white/50">{label}</Label>
        <Display className="text-4xl sm:text-5xl mb-4 max-w-3xl !text-white">
          {title}
        </Display>
        <Body className="text-lg max-w-2xl !text-white/70">
          {description}
        </Body>

        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            {stats.map((s) => (
              <div key={s.label}>
                <span className="font-[family-name:var(--font-mono)] text-2xl text-white tabular-nums block">
                  {s.value}
                </span>
                <span className="text-white/50 text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
