export const PLANS = {
  consumerReport: {
    name: 'Single Exposure Report',
    description: 'Detailed report with maps, AI narrative, and action recommendations for one address.',
    price: 29,
    priceId: process.env.STRIPE_CONSUMER_REPORT_PRICE_ID || '',
    type: 'one_time' as const,
    features: [
      'Full AI-written narrative summary',
      'Detailed water & soil layer data',
      'Expert-sourced action recommendations',
      'Interactive contamination map',
      'Data source citations',
    ],
  },
  proMonthly: {
    name: 'Bedrock Pro',
    description: 'Unlimited reports for real estate professionals.',
    price: 99,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    type: 'recurring' as const,
    interval: 'month' as const,
    features: [
      'Unlimited exposure reports',
      'PDF report generation',
      'Comparable addresses analysis',
      'Saved reports dashboard',
      'Priority data processing',
      'API access (coming soon)',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
