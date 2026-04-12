import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // console.warn('STRIPE_SECRET_KEY is missing. Stripe integrations will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_to_allow_builds', {
  // @ts-expect-error Stripe SDK demands the absolute latest date string
  apiVersion: '2025-02-24.acacia',
  appInfo: {
    name: 'suignature',
    version: '0.1.0'
  }
});
