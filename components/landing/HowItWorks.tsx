const steps = [
  {
    number: '01',
    title: 'Enter your address',
    description:
      'Type any U.S. address. Our geocoder pinpoints your exact location and identifies your water system, census tract, and soil survey area.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'We scan federal databases',
    description:
      'Bedrock queries EPA, USDA, NASA, USGS, FEMA, and Census data in real time to build a complete picture of your environmental exposure.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 8h2" />
        <path d="M7 12h4" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Get your exposure report',
    description:
      'See your Environmental Exposure Score, plain-English findings with data resolution transparency, and expert-sourced action recommendations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="bg-bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl text-text-primary">
            How it works
          </h2>
          <p className="mt-3 text-text-secondary text-lg">
            From address to actionable intelligence in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative p-6 rounded-[var(--radius-lg)] bg-bg-surface border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-light text-accent">
                  {step.icon}
                </div>
                <span className="text-sm font-mono text-text-tertiary">{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
