import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function CTAPro() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <ScrollReveal>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
            For professionals
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-text-primary leading-[1.15]">
            Environmental intelligence for real estate due diligence.
          </h2>
          <p className="mt-4 text-text-secondary text-lg leading-relaxed max-w-xl">
            PDF reports, comparable addresses, batch analysis, and API access.
            Everything inspectors, agents, and brokers need.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex px-6 py-3 rounded-[var(--radius-md)] bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Start free trial
            </Link>
            <span className="text-sm text-text-tertiary">$99/mo · Cancel anytime</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
