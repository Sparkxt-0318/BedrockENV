'use client';

import { useState, useCallback } from 'react';

interface PdfDownloadButtonProps {
  assessmentId: string;
  className?: string;
}

export function PdfDownloadButton({ assessmentId, className = '' }: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Download failed' }));
        setError(data.error || 'Download failed');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bedrock-report-${assessmentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-border text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {loading ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {error && <p className="mt-2 text-xs text-exposure-high">{error}</p>}
    </div>
  );
}
