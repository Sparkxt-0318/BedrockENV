import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Display, Headline, Body, Label, Mono } from '@/components/ui/Type';
import { ReferenceCite } from '@/components/ui/ReferenceCite';
import { ResolutionBadge, RiskBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { Score } from '@/components/ui/Score';
import { CoverageMeter } from '@/components/ui/CoverageMeter';
import { CountUp } from '@/components/ui/CountUp';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { StickyColumn } from '@/components/ui/StickyColumn';

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(private cb: IntersectionObserverCallback) {
      setTimeout(() => {
        cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }, 0);
    }
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe('Typography components', () => {
  it('renders Display with serif font class', () => {
    render(<Display>Test Heading</Display>);
    const el = screen.getByText('Test Heading');
    expect(el.tagName).toBe('H1');
    expect(el.className).toContain('font-display');
  });

  it('renders Headline as h2', () => {
    render(<Headline>Sub Heading</Headline>);
    expect(screen.getByText('Sub Heading').tagName).toBe('H2');
  });

  it('renders Body as p', () => {
    render(<Body>Paragraph text</Body>);
    expect(screen.getByText('Paragraph text').tagName).toBe('P');
  });

  it('renders Label as uppercase span', () => {
    render(<Label>Score</Label>);
    const el = screen.getByText('Score');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('uppercase');
  });

  it('renders Mono with mono font class', () => {
    render(<Mono>42</Mono>);
    const el = screen.getByText('42');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('tabular-nums');
  });

  it('accepts custom `as` prop', () => {
    render(<Display as="h3">Custom tag</Display>);
    expect(screen.getByText('Custom tag').tagName).toBe('H3');
  });
});

describe('ReferenceCite', () => {
  it('renders source text', () => {
    render(<ReferenceCite source="UCMR 5" agency="EPA" />);
    expect(screen.getByText('EPA')).toBeTruthy();
    expect(screen.getByText('UCMR 5')).toBeTruthy();
  });

  it('renders without agency', () => {
    render(<ReferenceCite source="OpenAQ" />);
    expect(screen.getByText('OpenAQ')).toBeTruthy();
  });
});

describe('Badge components', () => {
  it('renders resolution badges for all tiers', () => {
    const { rerender } = render(<ResolutionBadge resolution="property" />);
    expect(screen.getByText('Property-level')).toBeTruthy();

    rerender(<ResolutionBadge resolution="neighborhood" />);
    expect(screen.getByText('Neighborhood-level')).toBeTruthy();

    rerender(<ResolutionBadge resolution="area" />);
    expect(screen.getByText('Area-level')).toBeTruthy();
  });

  it('renders risk badges', () => {
    render(<RiskBadge tier="HIGH" />);
    expect(screen.getByText('HIGH')).toBeTruthy();
  });

  it('renders confidence badges', () => {
    render(<ConfidenceBadge confidence="insufficient" />);
    expect(screen.getByText('Insufficient data')).toBeTruthy();
  });
});

describe('Score', () => {
  it('renders with ARIA meter role', () => {
    render(<Score value={72} animate={false} />);
    const meter = screen.getByRole('meter');
    expect(meter).toBeTruthy();
    expect(meter.getAttribute('aria-valuenow')).toBe('72');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders score numeral', () => {
    render(<Score value={42} animate={false} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders confidence label when provided', () => {
    render(<Score value={50} confidence="high" animate={false} />);
    expect(screen.getByText('High confidence')).toBeTruthy();
  });

  it('renders all size variants', () => {
    const { rerender } = render(<Score value={50} size="sm" animate={false} />);
    expect(screen.getByRole('meter')).toBeTruthy();

    rerender(<Score value={50} size="lg" animate={false} />);
    expect(screen.getByRole('meter')).toBeTruthy();
  });
});

describe('CoverageMeter', () => {
  it('renders coverage percentage', () => {
    render(<CoverageMeter coverage={0.78} />);
    expect(screen.getByText('78%')).toBeTruthy();
    expect(screen.getByRole('meter')).toBeTruthy();
  });

  it('shows insufficient badge when not sufficient', () => {
    render(<CoverageMeter coverage={0.25} sufficient={false} />);
    expect(screen.getByText('Insufficient')).toBeTruthy();
  });

  it('hides label when showLabel is false', () => {
    render(<CoverageMeter coverage={0.50} showLabel={false} />);
    expect(screen.queryByText('50%')).toBeNull();
  });
});

describe('CountUp', () => {
  it('renders with mono font class', () => {
    render(<CountUp end={100} />);
    const el = document.querySelector('.tabular-nums');
    expect(el).toBeTruthy();
  });

  it('renders suffix', () => {
    render(<CountUp end={75} suffix="%" />);
    const el = document.querySelector('.tabular-nums');
    expect(el?.textContent).toContain('%');
  });
});

describe('ScrollReveal', () => {
  it('renders children', () => {
    render(<ScrollReveal><p>Hello</p></ScrollReveal>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('applies stagger class when stagger prop is true', () => {
    const { container } = render(<ScrollReveal stagger><p>A</p><p>B</p></ScrollReveal>);
    expect(container.firstElementChild?.className).toContain('stagger-children');
  });
});

describe('StickyColumn', () => {
  it('renders left and right children', () => {
    render(
      <StickyColumn
        left={<p>Left content</p>}
        right={<p>Right content</p>}
      />
    );
    expect(screen.getByText('Left content')).toBeTruthy();
    expect(screen.getByText('Right content')).toBeTruthy();
  });
});
