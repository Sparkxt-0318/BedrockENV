interface ReferenceCiteProps {
  source: string;
  agency?: string;
  className?: string;
}

export function ReferenceCite({ source, agency, className = '' }: ReferenceCiteProps) {
  return (
    <cite
      className={`not-italic inline-flex items-center gap-1 text-[11px] font-[family-name:var(--font-mono)] text-text-tertiary ${className}`}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        className="shrink-0 opacity-50"
      >
        <path
          d="M5 1v8M1 5h8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      {agency && <span className="font-medium text-text-secondary">{agency}</span>}
      {agency && <span aria-hidden="true">/</span>}
      <span>{source}</span>
    </cite>
  );
}
