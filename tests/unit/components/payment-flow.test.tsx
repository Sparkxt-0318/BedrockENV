import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FreePreviewOverlay } from '@/components/report/FreePreviewOverlay';

// Reports are fully free — FreePreviewOverlay is a no-op stub.
// These tests verify it renders without throwing.
describe('FreePreviewOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without error for basic usage', () => {
    const { container } = render(<FreePreviewOverlay assessmentId="test-123" />);
    expect(container).toBeTruthy();
  });

  it('renders without error when topFinding is provided', () => {
    const { container } = render(
      <FreePreviewOverlay
        assessmentId="test-123"
        topFinding="Water contamination scored 85/100 — highest risk layer detected."
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders nothing (reports are free, no gate needed)', () => {
    const { container } = render(<FreePreviewOverlay assessmentId="test-123" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Payment Plans', () => {
  it('exports correct plan prices', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.consumerReport.price).toBe(29);
    expect(PLANS.consumerReport.type).toBe('one_time');
    expect(PLANS.proMonthly.price).toBe(99);
    expect(PLANS.proMonthly.type).toBe('recurring');
  });

  it('consumer plan has expected features', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.consumerReport.features.length).toBeGreaterThan(0);
    expect(PLANS.consumerReport.features.some(f => f.includes('narrative'))).toBe(true);
  });

  it('pro plan has expected features', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.proMonthly.features.length).toBeGreaterThan(0);
    expect(PLANS.proMonthly.features.some(f => f.includes('Unlimited'))).toBe(true);
  });
});
