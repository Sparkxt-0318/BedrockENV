export type UserType = 'consumer' | 'inspector' | 'agent' | 'broker' | 'municipal' | 'researcher';
export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  userType: UserType;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  reportsPurchased: number;
  createdAt: string;
  updatedAt: string;
}
