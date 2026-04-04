import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-[family-name:var(--font-instrument-serif)] text-6xl text-accent mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-text-primary mb-2">
          Page not found
        </h1>
        <p className="text-text-secondary mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
