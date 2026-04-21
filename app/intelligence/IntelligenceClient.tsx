'use client';

import Link from 'next/link';
import { DuotoneImage } from '@/components/media/DuotoneImage';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { placeholders } from '@/lib/media/placeholders';

interface Brief {
  number: number;
  title: string;
  stat: string;
  description: string;
  image: string;
  href: string;
}

interface Upcoming {
  title: string;
  description: string;
}

export function IntelligenceClient({ briefs, upcoming }: { briefs: Brief[]; upcoming: Upcoming[] }) {
  return (
    <>
      {/* Duotone Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden">
        <DuotoneImage
          src="blue-marble"
          alt=""
          intensity={0.9}
          className="absolute inset-0 h-full w-full"
          priority
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(13,31,28,0.98) 0%, rgba(13,31,28,0.5) 50%, transparent 100%)',
        }} />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-32 sm:px-6 lg:px-8">
          <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-white/70 mb-4">
            Bedrock Intelligence
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-[1.15] text-white max-w-2xl">
            Original research from 15 federal datasets.
          </h1>
        </div>
      </section>

      {/* Brief Cards */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {briefs.map((brief) => (
              <Link
                key={brief.href}
                href={brief.href}
                className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-surface transition-all hover:border-border-strong hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden">
                  <BriefThumbnail image={brief.image} />
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] bg-black/50 backdrop-blur-sm font-[family-name:var(--font-mono)] text-[11px] text-white/80">
                      Brief #{brief.number}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug text-text-primary group-hover:text-accent transition-colors">
                    {brief.title}
                  </h3>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-accent font-medium">
                    {brief.stat}
                  </p>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {brief.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mt-16">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary mb-4">
              Coming Soon
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-md)] border border-border/60 bg-bg-elevated/50 p-5"
                >
                  <h3 className="font-medium text-text-secondary">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-tertiary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function BriefThumbnail({ image }: { image: string }) {
  const key = image.replace(/\.(webp|jpg)$/, '');
  const lqip = placeholders[key];

  return (
    <div className="relative h-full w-full">
      {lqip && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}
      <picture>
        <source srcSet={`/media/${key}.webp`} type="image/webp" />
        <img
          src={`/media/${key}.jpg`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: 'grayscale(100%) contrast(1.1) brightness(0.9)' }}
        />
      </picture>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(26,62,42,0.6), rgba(13,31,28,0.85))',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
