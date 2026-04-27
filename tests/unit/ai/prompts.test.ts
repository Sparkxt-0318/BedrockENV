import { describe, it, expect } from 'vitest';
import { buildFreeSummaryPrompt } from '@/lib/ai/prompts/free-summary';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import type { NarrativeRequest } from '@/lib/ai/types';

function makeRequest(overrides: Partial<NarrativeRequest> = {}): NarrativeRequest {
  return {
    address: '123 Main St, Springfield, IL',
    compositeScore: 55,
    confidence: 'moderate',
    waterScore: 70,
    soilScore: 40,
    waterSummary: 'PFAS detected at 8 ppt',
    soilSummary: 'Loam soil, 2 brownfields within 2 miles',
    layersIncluded: ['water', 'soil'],
    ...overrides,
  };
}

describe('buildFreeSummaryPrompt', () => {
  it('includes the address', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest());
    expect(prompt).toContain('123 Main St, Springfield, IL');
  });

  it('includes composite score and confidence', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest());
    expect(prompt).toContain('55/100');
    expect(prompt).toContain('moderate');
  });

  it('includes water score when provided', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest());
    expect(prompt).toContain('Water Score: 70/100');
    expect(prompt).toContain('PFAS detected at 8 ppt');
  });

  it('includes soil score when provided', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest());
    expect(prompt).toContain('Soil Score: 40/100');
    expect(prompt).toContain('Loam soil, 2 brownfields');
  });

  it('shows water unavailable when waterScore is null', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest({ waterScore: null }));
    expect(prompt).toContain('Water layer: data unavailable');
  });

  it('shows soil unavailable when soilScore is null', () => {
    const prompt = buildFreeSummaryPrompt(makeRequest({ soilScore: null }));
    expect(prompt).toContain('Soil layer: data unavailable');
  });

  it('includes layers included list', () => {
    const prompt = buildFreeSummaryPrompt(
      makeRequest({ layersIncluded: ['water', 'soil', 'air'] })
    );
    expect(prompt).toContain('water, soil, air');
  });
});

describe('SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof SYSTEM_PROMPT).toBe('string');
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('contains the key rule about not prescribing actions', () => {
    expect(SYSTEM_PROMPT).toContain('DESCRIBE');
    expect(SYSTEM_PROMPT).toContain('NEVER');
  });

  it('prohibits the word "safe"', () => {
    expect(SYSTEM_PROMPT).toContain('"safe"');
  });
});
