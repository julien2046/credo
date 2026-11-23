import { defineFunction, secret } from '@aws-amplify/backend';

// Provision the URL before Stripe generates its endpoint signing secret.
const ordersEnabled = process.env.STRIPE_ORDERS_ENABLED === 'true';
export const stripeWebhook = defineFunction({
  name: 'stripe-order-webhook',
  runtime: 22,
  timeoutSeconds: 25,
  environment: ordersEnabled
    ? {
        STRIPE_TEST_SECRET_KEY: secret('STRIPE_TEST_SECRET_KEY'),
        STRIPE_TEST_WEBHOOK_SECRET: secret('STRIPE_TEST_WEBHOOK_SECRET'),
      }
    : {},
});
