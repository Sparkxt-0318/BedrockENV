import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreePreviewOverlay } from '@/components/report/FreePreviewOverlay';

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    purchaseReport: vi.fn(),
    subscribePro: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('FreePreviewOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unlock CTA with price', () => {
    render(<FreePreviewOverlay assessmentId="test-123" />);
    const buttons = screen.getAllByText(/Unlock full report/);
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /\$29/ })).toBeTruthy();
  });

  it('shows top finding when provided', () => {
    render(
      <FreePreviewOverlay
        assessmentId="test-123"
        topFinding="Water contamination scored 85/100 — highest risk layer detected."
      />
    );
    expect(screen.getByText(/Water contamination scored 85/)).toBeTruthy();
    expect(screen.getByText('Top finding')).toBeTruthy();
  });

  it('shows sign in link for anonymous users', () => {
    render(<FreePreviewOverlay assessmentId="test-123" />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('shows Pro upsell link', () => {
    render(<FreePreviewOverlay assessmentId="test-123" />);
    expect(screen.getByText(/Or go Pro/)).toBeTruthy();
  });

  it('renders blurred placeholder content behind overlay', () => {
    const { container } = render(<FreePreviewOverlay assessmentId="test-123" />);
    const blurredElements = container.querySelectorAll('[aria-hidden="true"]');
    const blurred = Array.from(blurredElements).find(
      (el) => el.getAttribute('style')?.includes('blur')
    );
    expect(blurred).toBeTruthy();
  });

  it('displays one-time purchase label', () => {
    render(<FreePreviewOverlay assessmentId="test-123" />);
    expect(screen.getByText('One-time purchase')).toBeTruthy();
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
