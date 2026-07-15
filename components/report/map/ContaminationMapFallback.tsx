interface ContaminationMapFallbackProps {
  address: { normalized: string; latitude: number; longitude: number };
  brownfieldCount: number;
  superfundCount: number;
  echoCount: number;
}

export function ContaminationMapFallback({
  address,
  brownfieldCount,
  superfundCount,
  echoCount,
}: ContaminationMapFallbackProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden">
      <div className="bg-bg-elevated px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Location Map</h3>
        <span className="text-xs text-text-tertiary">
          {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
        </span>
      </div>
      <div className="h-64 flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <svg className="mx-auto mb-2 text-text-tertiary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-sm text-text-secondary">{address.normalized}</p>
          <p className="text-xs text-text-tertiary mt-1">
            Set NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive map
          </p>
          {(brownfieldCount > 0 || superfundCount > 0 || echoCount > 0) && (
            <div className="mt-2 space-y-0.5">
              {brownfieldCount > 0 && (
                <p className="text-xs text-text-secondary">{brownfieldCount} brownfield site(s) nearby</p>
              )}
              {superfundCount > 0 && (
                <p className="text-xs text-text-secondary">{superfundCount} Superfund NPL site(s) nearby</p>
              )}
              {echoCount > 0 && (
                <p className="text-xs text-text-secondary">{echoCount} regulated facilities nearby</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
