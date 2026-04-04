import Link from 'next/link';
import { Button } from '@/components/ui';

const audiences = [
  { role: 'Home Inspectors', benefit: 'Add environmental due diligence to every inspection report' },
  { role: "Buyer's Agents", benefit: 'Protect clients with contamination data before they close' },
  { role: 'Insurance Brokers', benefit: 'Assess environmental risk alongside standard property risk' },
];

export function CTAPro() {
  return (
    <section className="bg-bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <p className="text-xs text-accent uppercase tracking-widest font-medium mb-3">
                For professionals
              </p>
              <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl text-text-primary">
                Environmental intelligence for real estate professionals
              </h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Detailed PDF reports, comparable addresses, batch analysis, and API access.
                Everything you need to add environmental due diligence to your workflow.
              </p>
              <div className="mt-8">
                <Link href="/auth/signup">
                  <Button size="lg">Start free trial</Button>
                </Link>
                <p className="mt-2 text-xs text-text-tertiary">
                  $99/month for unlimited reports. Cancel anytime.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {audiences.map((a) => (
                <div
                  key={a.role}
                  className="p-5 rounded-[var(--radius-md)] border border-border bg-bg-primary"
                >
                  <p className="font-semibold text-text-primary text-sm">{a.role}</p>
                  <p className="mt-1 text-sm text-text-secondary">{a.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
